import EventEmitter from "eventemitter3";
import type {
  ChatAdapter,
  ChatAdapterOptions,
  ChatAdapterStatus,
  ChatMessage,
} from "../../types.js";

export type YouTubeAuth = {
  apiKey?: string;
  liveChatId?: string;
};

export type YouTubeFetchPayload = {
  liveChatId: string;
  pageToken?: string;
};

export type YouTubeFetchResult = {
  nextPageToken?: string;
  pollingIntervalMillis?: number;
  items?: unknown[];
};

type YouTubeTransport = {
  fetchMessages?: (payload: YouTubeFetchPayload) => Promise<YouTubeFetchResult>;
  sendMessage?: (payload: {
    liveChatId: string;
    message: string;
  }) => Promise<void>;
};

type YouTubeSnippet = {
  displayMessage?: string;
  publishedAt?: string;
};

type YouTubeAuthorDetails = {
  channelId?: string;
  displayName?: string;
  isChatModerator?: boolean;
  isChatOwner?: boolean;
  isChatSponsor?: boolean;
};

type YouTubeMessageItem = {
  id?: string;
  snippet?: YouTubeSnippet;
  authorDetails?: YouTubeAuthorDetails;
};

const DEFAULT_POLL_INTERVAL_MS = 5000;
const MIN_POLL_INTERVAL_MS = 1000;
const MAX_POLL_INTERVAL_MS = 15000;
// Backoff ceiling for consecutive poll failures. Matches the socket
// adapters, so a dead livestream or a revoked token settles at one request
// per 30s instead of hammering the API at the poll interval forever.
const MAX_ERROR_BACKOFF_MS = 30000;

export class YouTubeAdapter implements ChatAdapter {
  private emitter = new EventEmitter();
  private status: ChatAdapterStatus = "disconnected";
  private readonly channel: string;
  private readonly auth: YouTubeAuth;
  private readonly transport: YouTubeTransport;
  private readonly logger?: (message: string) => void;
  private pollTimer: ReturnType<typeof setTimeout> | null = null;
  private nextPageToken: string | undefined;
  private pollIntervalMs = DEFAULT_POLL_INTERVAL_MS;
  private seenIds = new Set<string>();
  private stopped = true;
  private consecutiveErrors = 0;

  constructor(
    options: ChatAdapterOptions & {
      auth?: YouTubeAuth;
      transport?: YouTubeTransport;
    },
  ) {
    this.channel = options.channel;
    this.auth = options.auth ?? {};
    this.transport = options.transport ?? {};
    this.logger = options.logger;
  }

  onMessage(handler: (message: ChatMessage) => void) {
    this.emitter.on("message", handler);
    return () => {
      this.emitter.off("message", handler);
    };
  }

  onStatus(handler: (status: ChatAdapterStatus) => void) {
    this.emitter.on("status", handler);
    return () => {
      this.emitter.off("status", handler);
    };
  }

  private setStatus(status: ChatAdapterStatus) {
    this.status = status;
    this.emitter.emit("status", status);
  }

  async connect() {
    if (!this.auth.liveChatId) {
      const error = "YouTube adapter requires a Live Chat ID.";
      this.logger?.(error);
      this.setStatus("error");
      throw new Error(error);
    }
    if (!this.transport.fetchMessages && !this.auth.apiKey) {
      const error =
        "YouTube adapter requires OAuth transport or API key for polling.";
      this.logger?.(error);
      this.setStatus("error");
      throw new Error(error);
    }

    this.stopped = false;
    this.consecutiveErrors = 0;

    this.setStatus("connecting");
    this.logger?.("Connecting to YouTube Live Chat...");
    try {
      await this.fetchAndEmit();
    } catch (error) {
      // Without this the status stays on "connecting" forever and the
      // caller sees a raw throw with no state transition behind it.
      this.setStatus("error");
      throw error;
    }
    this.setStatus("connected");
    this.scheduleNextPoll();
  }

  private clampPollingInterval(value: number | undefined) {
    if (!value || !Number.isFinite(value)) return DEFAULT_POLL_INTERVAL_MS;
    return Math.max(
      MIN_POLL_INTERVAL_MS,
      Math.min(MAX_POLL_INTERVAL_MS, Math.floor(value)),
    );
  }

  private async fetchPage(): Promise<YouTubeFetchResult> {
    if (!this.auth.liveChatId) {
      throw new Error("YouTube live chat id is missing.");
    }
    if (this.transport.fetchMessages) {
      return this.transport.fetchMessages({
        liveChatId: this.auth.liveChatId,
        pageToken: this.nextPageToken,
      });
    }
    if (!this.auth.apiKey) {
      throw new Error("No YouTube polling transport or API key is configured.");
    }

    const params = new URLSearchParams({
      part: "snippet,authorDetails",
      liveChatId: this.auth.liveChatId,
      key: this.auth.apiKey,
      maxResults: "200",
    });
    if (this.nextPageToken) params.set("pageToken", this.nextPageToken);

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/liveChat/messages?${params}`,
    );
    if (!response.ok) {
      throw new Error(`YouTube polling request failed (${response.status}).`);
    }
    return (await response.json()) as YouTubeFetchResult;
  }

  private asMessageItem(item: unknown): YouTubeMessageItem | null {
    if (!item || typeof item !== "object") return null;
    return item as YouTubeMessageItem;
  }

  private toMessage(item: YouTubeMessageItem): ChatMessage | null {
    const id = typeof item.id === "string" ? item.id : "";
    if (!id || this.seenIds.has(id)) return null;
    const snippet = item.snippet ?? {};
    const author = item.authorDetails ?? {};

    const text =
      typeof snippet.displayMessage === "string" ? snippet.displayMessage : "";
    if (!text) return null;

    const badges: string[] = [];
    if (author.isChatOwner) badges.push("owner");
    if (author.isChatModerator) badges.push("moderator");
    if (author.isChatSponsor) badges.push("member");

    this.seenIds.add(id);
    if (this.seenIds.size > 5000) {
      const compact = Array.from(this.seenIds).slice(-3000);
      this.seenIds = new Set(compact);
    }

    return {
      id,
      platform: "youtube",
      channel: this.channel,
      username: author.channelId ?? "",
      displayName: author.displayName ?? "YouTube user",
      message: text,
      timestamp: snippet.publishedAt ?? new Date().toISOString(),
      badges,
      raw: item as unknown as Record<string, unknown>,
    };
  }

  private async fetchAndEmit() {
    const data = await this.fetchPage();
    this.nextPageToken =
      typeof data.nextPageToken === "string"
        ? data.nextPageToken
        : this.nextPageToken;
    this.pollIntervalMs = this.clampPollingInterval(data.pollingIntervalMillis);

    if (Array.isArray(data.items)) {
      for (const rawItem of data.items) {
        const item = this.asMessageItem(rawItem);
        if (!item) continue;
        const message = this.toMessage(item);
        if (message) {
          this.emitter.emit("message", message);
        }
      }
    }
  }

  private nextPollDelayMs() {
    if (this.consecutiveErrors === 0) return this.pollIntervalMs;
    // Exponential backoff from the current poll interval, capped. Applied
    // only while failing; a single success resets it. Doubling starts on the
    // first failure -- 2 ** (n - 1) would retry the first one at the normal
    // interval, which is not a backoff at all.
    return Math.min(
      MAX_ERROR_BACKOFF_MS,
      this.pollIntervalMs * 2 ** this.consecutiveErrors,
    );
  }

  private scheduleNextPoll() {
    if (this.stopped) return;
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
    }

    this.pollTimer = setTimeout(() => {
      void this.pollLoop();
    }, this.nextPollDelayMs());
  }

  private async pollLoop() {
    if (this.stopped) return;
    try {
      await this.fetchAndEmit();
      this.consecutiveErrors = 0;
      if (this.status !== "connected") {
        this.setStatus("connected");
      }
    } catch (error) {
      this.consecutiveErrors += 1;
      this.logger?.(
        `YouTube polling error (attempt ${this.consecutiveErrors}, retrying in ${this.nextPollDelayMs()}ms): ${String(error)}`,
      );
      this.setStatus("error");
    } finally {
      this.scheduleNextPoll();
    }
  }

  async disconnect() {
    this.stopped = true;
    if (this.pollTimer) clearTimeout(this.pollTimer);
    this.pollTimer = null;
    this.nextPageToken = undefined;
    this.setStatus("disconnected");
  }

  async sendMessage(message: string) {
    const trimmed = message.trim();
    if (!trimmed) return;
    if (!this.auth.liveChatId) {
      throw new Error("YouTube live chat id is missing.");
    }
    if (!this.transport.sendMessage) {
      throw new Error("Sending YouTube chat messages requires OAuth sign-in.");
    }
    await this.transport.sendMessage({
      liveChatId: this.auth.liveChatId,
      message: trimmed,
    });
  }
}
