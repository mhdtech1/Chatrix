import { create } from "zustand";
import type { UpdateStatus } from "../../shared/types";
import {
  createInitialUpdateStatus,
  type MentionInboxEntry,
  type ModerationHistoryEntry,
} from "../types/chatSession";

type Updater<T> = T | ((previous: T) => T);

type ChatSessionStoreState = {
  updateStatus: UpdateStatus;
  mentionInbox: MentionInboxEntry[];
  moderationHistory: ModerationHistoryEntry[];
  setUpdateStatus: (updater: Updater<UpdateStatus>) => void;
  setMentionInbox: (updater: Updater<MentionInboxEntry[]>) => void;
  setModerationHistory: (updater: Updater<ModerationHistoryEntry[]>) => void;
  resetChatSessionState: (channel?: UpdateStatus["channel"]) => void;
};

const applyUpdater = <T>(previous: T, updater: Updater<T>): T =>
  typeof updater === "function"
    ? (updater as (previousState: T) => T)(previous)
    : updater;

export const useChatSessionStore = create<ChatSessionStoreState>((set) => ({
  updateStatus: createInitialUpdateStatus("stable"),
  mentionInbox: [],
  moderationHistory: [],
  setUpdateStatus: (updater) =>
    set((state) => ({
      updateStatus: applyUpdater(state.updateStatus, updater),
    })),
  setMentionInbox: (updater) =>
    set((state) => ({
      mentionInbox: applyUpdater(state.mentionInbox, updater),
    })),
  setModerationHistory: (updater) =>
    set((state) => ({
      moderationHistory: applyUpdater(state.moderationHistory, updater),
    })),
  resetChatSessionState: (channel = "stable") =>
    set({
      updateStatus: createInitialUpdateStatus(channel),
      mentionInbox: [],
      moderationHistory: [],
    }),
}));
