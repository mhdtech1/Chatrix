import type { UpdateStatus } from "../../shared/types";
import type { Platform } from "../../shared/types";

export type MentionInboxEntry = {
  id: string;
  sourceId: string;
  tabId: string | null;
  reason: "mention" | "reply";
  platform: Platform;
  channel: string;
  displayName: string;
  message: string;
  timestamp: string;
};

export type ModerationHistoryEntry = {
  id: string;
  at: number;
  action: string;
  target: string;
  source: string;
  ok: boolean;
};

export const createInitialUpdateStatus = (
  channel: UpdateStatus["channel"],
): UpdateStatus => ({
  state: "idle",
  message: "",
  channel,
  currentVersion: "unknown",
});
