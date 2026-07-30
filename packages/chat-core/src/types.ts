export type ChatPlatform = "twitch" | "kick" | "youtube" | "tiktok";

export type ChatMessage = {
  id: string;
  platform: ChatPlatform;
  channel: string;
  username: string;
  displayName: string;
  message: string;
  timestamp: string;
  badges?: string[];
  color?: string;
  raw?: Record<string, unknown>;
};

export type ChatAdapterStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

export type ChatAdapterOptions = {
  channel: string;
  logger?: (message: string) => void;
};

/**
 * Handler registration returns an unsubscribe function. Without one there is
 * no way to detach a listener, so re-entering connection setup on an existing
 * adapter instance permanently duplicates handlers and every message is
 * delivered N times.
 */
export type Unsubscribe = () => void;

export type ChatAdapter = {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  sendMessage: (message: string) => Promise<void>;
  onMessage: (handler: (message: ChatMessage) => void) => Unsubscribe;
  onStatus: (handler: (status: ChatAdapterStatus) => void) => Unsubscribe;
};
