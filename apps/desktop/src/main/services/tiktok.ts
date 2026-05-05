import crypto from "node:crypto";
import { shell } from "electron";
import { IPC_CHANNELS } from "../../shared/constants.js";
import { mainWindow, store, bringAppToFrontAfterOAuth } from "../runtime.js";
import { session, BrowserWindow, type Cookie, type Session } from "electron";
import { AUTH } from "../../shared/constants.js";
import type { TikTokRendererEvent } from "../../shared/types.js";
import { randomToken, TIKTOK_ALPHA_ENABLED } from "../runtime.js";
import tikTokLiveConnectorCjs from "tiktok-live-connector";

type TikTokConnectorModule = typeof import("tiktok-live-connector");
const tikTokLiveConnector = ((
  tikTokLiveConnectorCjs as unknown as { default?: TikTokConnectorModule }
).default ??
  (tikTokLiveConnectorCjs as unknown as TikTokConnectorModule)) as TikTokConnectorModule;
const { TikTokLiveConnection, WebcastEvent, ControlEvent } =
  tikTokLiveConnector;
export const TIKTOK_ALPHA_DISABLED_MESSAGE =
  "TikTok LIVE is an alpha-only feature and is disabled in this beta build.";
export const TIKTOK_SIGN_IN_CANCELLED_MESSAGE =
  "TikTok sign-in was cancelled before completion.";
export const TIKTOK_SIGN_IN_TIMEOUT_MESSAGE =
  "TikTok sign-in timed out. Please try again.";
export const TIKTOK_SIGN_IN_REQUIRED_MESSAGE =
  "Sign in with TikTok before sending messages.";
export const TIKTOK_SIGN_KEY_REQUIRED_MESSAGE =
  "TikTok sending is not configured in this build.";
export const TIKTOK_AUTH_PARTITION = "persist:chatrix-tiktok-auth";
export const TIKTOK_AUTH_TIMEOUT_MS = AUTH.TIKTOK_AUTH_TIMEOUT_MS;
export const TIKTOK_LOGIN_URL = "https://www.tiktok.com/login";
export const isSafeExternalUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};
export const TIKTOK_SIGN_API_KEY = (
  process.env.TIKTOK_SIGN_API_KEY ?? ""
).trim();
export const assertTikTokAlphaEnabled = () => {
  if (!TIKTOK_ALPHA_ENABLED) {
    throw new Error(TIKTOK_ALPHA_DISABLED_MESSAGE);
  }
};
export const isTikTokCookie = (cookie: Cookie) => {
  const domain = (cookie.domain ?? "").trim().toLowerCase();
  return domain.includes("tiktok.com");
};
export const pickCookieValue = (cookies: Cookie[]): string => {
  const valid = cookies
    .filter(
      (cookie) =>
        isTikTokCookie(cookie) &&
        typeof cookie.value === "string" &&
        cookie.value.trim().length > 0,
    )
    .sort(
      (left, right) =>
        Number(right.expirationDate ?? 0) - Number(left.expirationDate ?? 0),
    );
  return valid[0]?.value.trim() ?? "";
};
export const readTikTokAuthFromSession = async (
  authSession: Session,
): Promise<{ sessionId: string; ttTargetIdc: string } | null> => {
  const [sessionCookies, idcCookies] = await Promise.all([
    authSession.cookies.get({ name: "sessionid" }),
    authSession.cookies.get({ name: "tt-target-idc" }),
  ]);
  const sessionId = pickCookieValue(sessionCookies);
  const ttTargetIdc = pickCookieValue(idcCookies);
  if (!sessionId || !ttTargetIdc) return null;
  return { sessionId, ttTargetIdc };
};
export const cookieRemovalUrl = (cookie: Cookie): string | null => {
  const rawDomain = (cookie.domain ?? "").trim();
  if (!rawDomain) return null;
  const domain = rawDomain.startsWith(".") ? rawDomain.slice(1) : rawDomain;
  if (!domain) return null;
  const pathValue = (cookie.path ?? "/").trim();
  const cookiePath = pathValue.startsWith("/") ? pathValue : `/${pathValue}`;
  const protocol = cookie.secure ? "https" : "http";
  return `${protocol}://${domain}${cookiePath}`;
};
export const clearTikTokAuthSession = async (
  authSession: Session,
): Promise<void> => {
  const cookies = await authSession.cookies.get({});
  const targets = cookies.filter((cookie) => isTikTokCookie(cookie));
  await Promise.allSettled(
    targets.map(async (cookie) => {
      const url = cookieRemovalUrl(cookie);
      if (!url) return;
      try {
        await authSession.cookies.remove(url, cookie.name);
      } catch {
        // best effort cleanup only
      }
    }),
  );
};
export const openTikTokSignInWindow = async (): Promise<{
  sessionId: string;
  ttTargetIdc: string;
}> => {
  const authSession = session.fromPartition(TIKTOK_AUTH_PARTITION);
  const existing = await readTikTokAuthFromSession(authSession);
  if (existing) return existing;

  return new Promise((resolve, reject) => {
    let settled = false;
    const authWindow = new BrowserWindow({
      width: 520,
      height: 780,
      minWidth: 420,
      minHeight: 620,
      autoHideMenuBar: true,
      show: false,
      title: "Sign in to TikTok",
      parent: mainWindow ?? undefined,
      modal: Boolean(mainWindow),
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        partition: TIKTOK_AUTH_PARTITION,
      },
    });

    const onCookieChanged = (_event: unknown, cookie: Cookie) => {
      if (!isTikTokCookie(cookie)) return;
      if (cookie.name !== "sessionid" && cookie.name !== "tt-target-idc")
        return;
      void tryCaptureAuthCookies();
    };

    const onDidChangeNavigation = () => {
      void tryCaptureAuthCookies();
    };

    const onReadyToShow = () => {
      if (!authWindow.isDestroyed()) authWindow.show();
    };

    const onClosed = () => {
      if (settled) return;
      finish(undefined, new Error(TIKTOK_SIGN_IN_CANCELLED_MESSAGE));
    };

    const timeout = setTimeout(() => {
      finish(undefined, new Error(TIKTOK_SIGN_IN_TIMEOUT_MESSAGE));
      if (!authWindow.isDestroyed()) {
        authWindow.close();
      }
    }, TIKTOK_AUTH_TIMEOUT_MS);

    const cleanup = () => {
      clearTimeout(timeout);
      authSession.cookies.removeListener("changed", onCookieChanged);
      authWindow.removeListener("ready-to-show", onReadyToShow);
      authWindow.removeListener("closed", onClosed);
      authWindow.webContents.removeListener(
        "did-finish-load",
        onDidChangeNavigation,
      );
      authWindow.webContents.removeListener(
        "did-navigate",
        onDidChangeNavigation,
      );
      authWindow.webContents.removeListener(
        "did-navigate-in-page",
        onDidChangeNavigation,
      );
    };

    const finish = (
      result?: { sessionId: string; ttTargetIdc: string },
      error?: Error,
    ) => {
      if (settled) return;
      settled = true;
      cleanup();
      bringAppToFrontAfterOAuth();
      if (error) {
        reject(error);
        return;
      }
      if (!result) {
        reject(new Error(TIKTOK_SIGN_IN_CANCELLED_MESSAGE));
        return;
      }
      resolve(result);
    };

    const tryCaptureAuthCookies = async () => {
      try {
        const credentials = await readTikTokAuthFromSession(authSession);
        if (!credentials) return;
        finish(credentials);
        if (!authWindow.isDestroyed()) {
          authWindow.close();
        }
      } catch {
        // keep auth flow alive and let user retry in window
      }
    };

    authSession.cookies.on("changed", onCookieChanged);
    authWindow.webContents.on("did-finish-load", onDidChangeNavigation);
    authWindow.webContents.on("did-navigate", onDidChangeNavigation);
    authWindow.webContents.on("did-navigate-in-page", onDidChangeNavigation);
    authWindow.once("ready-to-show", onReadyToShow);
    authWindow.once("closed", onClosed);
    authWindow.webContents.setWindowOpenHandler(({ url }) => {
      if (isSafeExternalUrl(url)) {
        void shell.openExternal(url);
      }
      return { action: "deny" };
    });

    void authWindow.loadURL(TIKTOK_LOGIN_URL).catch((error) => {
      const text = error instanceof Error ? error.message : String(error);
      finish(undefined, new Error(`Failed to open TikTok sign-in: ${text}`));
    });
  });
};
export const asUnknownRecord = (
  value: unknown,
): Record<string, unknown> | null => {
  if (!value || typeof value !== "object") return null;
  return value as Record<string, unknown>;
};
export const asString = (value: unknown) => {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return "";
};
export const normalizeTikTokChannel = (input: string) =>
  input.trim().replace(/^@+/, "").toLowerCase();
export const isLikelyTikTokOfflineError = (value: string) => {
  const text = value.toLowerCase();
  if (!text.trim()) return false;
  return (
    text.includes("offline") ||
    text.includes("not live") ||
    text.includes("live has ended") ||
    text.includes("no active live") ||
    text.includes("failed to retrieve room id") ||
    text.includes("room id not found") ||
    text.includes("room not found") ||
    text.includes("channel is offline")
  );
};

export type NormalizedTikTokChatMessage = {
  id: string;
  platform: "tiktok";
  channel: string;
  username: string;
  displayName: string;
  message: string;
  timestamp: string;
  badges?: string[];
  color?: string;
  raw?: Record<string, unknown>;
};
export type TikTokConnection = {
  connect: () => Promise<
    { roomId?: string | number } | Record<string, unknown>
  >;
  disconnect: () => Promise<void>;
  sendMessage?: (content: string) => Promise<unknown>;
  on: (event: string, listener: (...args: unknown[]) => void) => unknown;
  removeAllListeners?: (...args: unknown[]) => void;
};
export type TikTokConnectionRecord = {
  connectionId: string;
  channel: string;
  roomId?: string;
  connection: TikTokConnection;
};

export const parseTikTokBadges = (rawBadges: unknown): string[] => {
  if (!Array.isArray(rawBadges)) return [];
  const parsed: string[] = [];
  for (const badge of rawBadges) {
    const asText = asString(badge).trim();
    if (asText) {
      parsed.push(asText);
      continue;
    }
    const record = asUnknownRecord(badge);
    const type = asString(record?.type).trim();
    const name = asString(record?.name).trim();
    const title = asString(record?.title).trim();
    const value = type || name || title;
    if (value) parsed.push(value);
  }
  return parsed;
};
export const normalizeTikTokChatMessage = (
  channel: string,
  payload: unknown,
): NormalizedTikTokChatMessage | null => {
  const record = asUnknownRecord(payload);
  if (!record) return null;

  const comment =
    asString(record.comment).trim() || asString(record.message).trim();
  if (!comment) return null;

  const user = asUnknownRecord(record.user) ?? {};
  const username =
    asString(user.uniqueId).trim() ||
    asString(user.username).trim() ||
    "tiktok-user";
  const displayName =
    asString(user.nickname).trim() ||
    asString(user.displayName).trim() ||
    username;
  const messageId =
    asString(record.msgId).trim() ||
    asString(record.messageId).trim() ||
    `${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;

  const createdEpochRaw = Number(asString(record.createTime));
  const createdEpochMillis =
    Number.isFinite(createdEpochRaw) && createdEpochRaw > 0
      ? createdEpochRaw < 1_000_000_000_000
        ? createdEpochRaw * 1000
        : createdEpochRaw
      : 0;
  const createdAt =
    createdEpochMillis > 0
      ? new Date(createdEpochMillis).toISOString()
      : new Date().toISOString();

  const color =
    asString(user.nameColor).trim() || asString(user.color).trim() || undefined;
  const badges = parseTikTokBadges(user.badges);

  return {
    id: messageId,
    platform: "tiktok",
    channel,
    username,
    displayName,
    message: comment,
    timestamp: createdAt,
    badges: badges.length > 0 ? badges : undefined,
    color,
    raw: record,
  };
};
export const normalizeTikTokFollowMessage = (
  channel: string,
  payload: unknown,
): NormalizedTikTokChatMessage | null => {
  const record = asUnknownRecord(payload);
  if (!record) return null;

  const user = asUnknownRecord(record.user) ?? {};
  const username =
    asString(user.uniqueId).trim() ||
    asString(user.username).trim() ||
    "tiktok-user";
  const displayName =
    asString(user.nickname).trim() ||
    asString(user.displayName).trim() ||
    username;
  const messageId =
    asString(record.msgId).trim() ||
    asString(record.messageId).trim() ||
    `${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
  const createdEpochRaw = Number(asString(record.createTime));
  const createdEpochMillis =
    Number.isFinite(createdEpochRaw) && createdEpochRaw > 0
      ? createdEpochRaw < 1_000_000_000_000
        ? createdEpochRaw * 1000
        : createdEpochRaw
      : 0;
  const createdAt =
    createdEpochMillis > 0
      ? new Date(createdEpochMillis).toISOString()
      : new Date().toISOString();

  return {
    id: messageId,
    platform: "tiktok",
    channel,
    username,
    displayName,
    message: `${displayName} followed`,
    timestamp: createdAt,
    raw: {
      ...record,
      eventType: "follow",
    },
  };
};
export const tiktokConnections = new Map<string, TikTokConnectionRecord>();
export const emitTikTokEvent = (payload: TikTokRendererEvent) => {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.webContents.send(IPC_CHANNELS.TIKTOK_EVENT, payload);
};
export const disconnectTikTokConnection = async (connectionId: string) => {
  const record = tiktokConnections.get(connectionId);
  if (!record) return;
  tiktokConnections.delete(connectionId);
  try {
    await record.connection.disconnect();
  } catch {
    // no-op
  } finally {
    record.connection.removeAllListeners?.();
    emitTikTokEvent({
      connectionId,
      type: "disconnected",
      roomId: record.roomId,
    });
  }
};
export const disconnectAllTikTokConnections = async () => {
  const ids = Array.from(tiktokConnections.keys());
  await Promise.allSettled(
    ids.map((connectionId) => disconnectTikTokConnection(connectionId)),
  );
};
export const connectTikTokChannel = async (channel: string) => {
  assertTikTokAlphaEnabled();
  const normalizedChannel = normalizeTikTokChannel(channel);
  if (!normalizedChannel) {
    throw new Error("TikTok channel is required.");
  }

  const sessionId = store.get("tiktokSessionId")?.trim() ?? "";
  const ttTargetIdc = store.get("tiktokTtTargetIdc")?.trim() ?? "";
  const activeSignApiKey = TIKTOK_SIGN_API_KEY;
  const hasAuthenticatedSession = Boolean(sessionId && ttTargetIdc);

  const connectionOptions: Record<string, unknown> = {
    processInitialData: false,
    fetchRoomInfoOnConnect: true,
    enableExtendedGiftInfo: false,
    enableRequestPolling: true,
  };
  if (activeSignApiKey) {
    connectionOptions.signApiKey = activeSignApiKey;
  }
  if (hasAuthenticatedSession) {
    connectionOptions.sessionId = sessionId;
    connectionOptions.ttTargetIdc = ttTargetIdc;
    connectionOptions.authenticateWs = false;
  }

  const connectionId = randomToken(18);
  const connection = new TikTokLiveConnection(
    normalizedChannel,
    connectionOptions as ConstructorParameters<typeof TikTokLiveConnection>[1],
  ) as unknown as TikTokConnection;
  const record: TikTokConnectionRecord = {
    connectionId,
    channel: normalizedChannel,
    connection,
  };

  tiktokConnections.set(connectionId, record);

  let connectedEventSent = false;
  const emitConnected = () => {
    if (connectedEventSent) return;
    connectedEventSent = true;
    emitTikTokEvent({
      connectionId,
      type: "connected",
      roomId: record.roomId,
    });
  };

  connection.on(WebcastEvent.CHAT, (payload: unknown) => {
    const message = normalizeTikTokChatMessage(normalizedChannel, payload);
    if (!message) return;
    emitTikTokEvent({
      connectionId,
      type: "chat",
      roomId: record.roomId,
      message,
    });
  });

  const followEventName = (WebcastEvent as Record<string, string | undefined>)
    .FOLLOW;
  if (followEventName) {
    connection.on(followEventName, (payload: unknown) => {
      const message = normalizeTikTokFollowMessage(normalizedChannel, payload);
      if (!message) return;
      emitTikTokEvent({
        connectionId,
        type: "chat",
        roomId: record.roomId,
        message,
      });
    });
  }

  connection.on(ControlEvent.CONNECTED, (state: unknown) => {
    const roomId = asString(asUnknownRecord(state)?.roomId).trim();
    if (roomId) {
      record.roomId = roomId;
    }
    emitConnected();
  });

  connection.on(ControlEvent.DISCONNECTED, (payload: unknown) => {
    const reason = asString(asUnknownRecord(payload)?.reason).trim();
    if (tiktokConnections.has(connectionId)) {
      tiktokConnections.delete(connectionId);
      connection.removeAllListeners?.();
    }
    emitTikTokEvent({
      connectionId,
      type: "disconnected",
      roomId: record.roomId,
      error: reason || undefined,
    });
  });

  connection.on(ControlEvent.ERROR, (error: unknown) => {
    const text = error instanceof Error ? error.message : String(error);
    emitTikTokEvent({
      connectionId,
      type: "error",
      roomId: record.roomId,
      error: text,
    });
  });

  try {
    const state = (await connection.connect()) as Record<
      string,
      unknown
    > | null;
    const roomId = asString(asUnknownRecord(state)?.roomId).trim();
    if (roomId) {
      record.roomId = roomId;
    }
    emitConnected();
    return {
      connectionId,
      roomId: record.roomId,
    };
  } catch (error) {
    tiktokConnections.delete(connectionId);
    connection.removeAllListeners?.();
    const text = error instanceof Error ? error.message : String(error);
    emitTikTokEvent({
      connectionId,
      type: "error",
      error: text,
    });
    if (isLikelyTikTokOfflineError(text)) {
      throw new Error(
        `TikTok channel @${normalizedChannel} is offline right now.`,
      );
    }
    throw new Error(`TikTok connect failed: ${text}`);
  }
};
export const sendTikTokMessage = async (payload: {
  connectionId?: string;
  message?: string;
}) => {
  assertTikTokAlphaEnabled();
  const connectionId = payload?.connectionId?.trim();
  const message = payload?.message?.trim();
  const sessionId = store.get("tiktokSessionId")?.trim() ?? "";
  const ttTargetIdc = store.get("tiktokTtTargetIdc")?.trim() ?? "";
  const activeSignApiKey = TIKTOK_SIGN_API_KEY;
  if (!connectionId) {
    throw new Error("TikTok connection id is required.");
  }
  if (!message) {
    throw new Error("Message cannot be empty.");
  }
  if (!sessionId || !ttTargetIdc) {
    throw new Error(TIKTOK_SIGN_IN_REQUIRED_MESSAGE);
  }
  if (!activeSignApiKey) {
    throw new Error(TIKTOK_SIGN_KEY_REQUIRED_MESSAGE);
  }
  const record = tiktokConnections.get(connectionId);
  if (!record) {
    throw new Error("TikTok connection is not ready.");
  }
  if (typeof record.connection.sendMessage !== "function") {
    throw new Error("TikTok sending is not enabled for this alpha build.");
  }
  try {
    await record.connection.sendMessage(message);
  } catch (error) {
    const text = error instanceof Error ? error.message : String(error);
    throw new Error(`TikTok send failed: ${text}`);
  }
};
export const signInTikTok = async () => {
  assertTikTokAlphaEnabled();
  const authSession = session.fromPartition(TIKTOK_AUTH_PARTITION);
  attemptTikTokBrowserSignIn();
  const credentials = await openTikTokSignInWindow();
  store.set({
    tiktokSessionId: credentials.sessionId,
    tiktokTtTargetIdc: credentials.ttTargetIdc,
    tiktokUsername: store.get("tiktokUsername")?.trim() || "signed-in",
  });
  const resolved = await readTikTokAuthFromSession(authSession);
  if (!resolved) {
    throw new Error(
      "TikTok sign-in completed, but session cookies were not persisted.",
    );
  }
  return store.store;
};
export const signOutTikTok = async () => {
  const authSession = session.fromPartition(TIKTOK_AUTH_PARTITION);
  await clearTikTokAuthSession(authSession);
  store.set({
    tiktokSessionId: "",
    tiktokTtTargetIdc: "",
    tiktokUsername: "",
  });
  await disconnectAllTikTokConnections();
  return store.store;
};
export const attemptTikTokBrowserSignIn = () => {
  const loginWindow = new BrowserWindow({
    width: 500,
    height: 700,
    show: true,
    parent: mainWindow ?? undefined,
    modal: true,
    webPreferences: {
      partition: TIKTOK_AUTH_PARTITION,
    },
  });
  loginWindow.loadURL(TIKTOK_LOGIN_URL);
};
