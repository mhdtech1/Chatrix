import { create } from "zustand";
import type { ChatMessage } from "@chatrix/chat-core";

type Updater<T> = T | ((previous: T) => T);

export const DEFAULT_SEND_TARGET_ID = "__all_in_tab__";

export type MessagesBySource = Record<string, ChatMessage[]>;
export type CountByTab = Record<string, number>;
export type TimestampByTab = Record<string, number>;
export type DraftByTab = Record<string, string>;

const applyUpdater = <T>(previous: T, updater: Updater<T>): T =>
  typeof updater === "function"
    ? (updater as (previousState: T) => T)(previous)
    : updater;

type ChatWorkspaceStoreState = {
  messagesBySource: MessagesBySource;
  tabUnreadCounts: CountByTab;
  tabMentionCounts: CountByTab;
  lastReadAtByTab: TimestampByTab;
  deckComposerByTabId: DraftByTab;
  sendTargetId: string;
  composerHistory: string[];
  setMessagesBySource: (updater: Updater<MessagesBySource>) => void;
  setTabUnreadCounts: (updater: Updater<CountByTab>) => void;
  setTabMentionCounts: (updater: Updater<CountByTab>) => void;
  setLastReadAtByTab: (updater: Updater<TimestampByTab>) => void;
  setDeckComposerByTabId: (updater: Updater<DraftByTab>) => void;
  setSendTargetId: (updater: Updater<string>) => void;
  setComposerHistory: (updater: Updater<string[]>) => void;
  resetWorkspaceState: () => void;
};

export const useChatWorkspaceStore = create<ChatWorkspaceStoreState>((set) => ({
  messagesBySource: {},
  tabUnreadCounts: {},
  tabMentionCounts: {},
  lastReadAtByTab: {},
  deckComposerByTabId: {},
  sendTargetId: DEFAULT_SEND_TARGET_ID,
  composerHistory: [],
  setMessagesBySource: (updater) =>
    set((state) => ({
      messagesBySource: applyUpdater(state.messagesBySource, updater),
    })),
  setTabUnreadCounts: (updater) =>
    set((state) => ({
      tabUnreadCounts: applyUpdater(state.tabUnreadCounts, updater),
    })),
  setTabMentionCounts: (updater) =>
    set((state) => ({
      tabMentionCounts: applyUpdater(state.tabMentionCounts, updater),
    })),
  setLastReadAtByTab: (updater) =>
    set((state) => ({
      lastReadAtByTab: applyUpdater(state.lastReadAtByTab, updater),
    })),
  setDeckComposerByTabId: (updater) =>
    set((state) => ({
      deckComposerByTabId: applyUpdater(state.deckComposerByTabId, updater),
    })),
  setSendTargetId: (updater) =>
    set((state) => ({
      sendTargetId: applyUpdater(state.sendTargetId, updater),
    })),
  setComposerHistory: (updater) =>
    set((state) => ({
      composerHistory: applyUpdater(state.composerHistory, updater),
    })),
  resetWorkspaceState: () =>
    set({
      messagesBySource: {},
      tabUnreadCounts: {},
      tabMentionCounts: {},
      lastReadAtByTab: {},
      deckComposerByTabId: {},
      sendTargetId: DEFAULT_SEND_TARGET_ID,
      composerHistory: [],
    }),
}));
