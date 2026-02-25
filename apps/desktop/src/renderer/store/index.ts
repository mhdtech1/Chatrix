import { create } from "zustand";
import type { ChatMessage } from "@multichat/chat-core";

type SettingsState = {
  showTimestamps: boolean;
  showBadges: boolean;
  setShowTimestamps: (enabled: boolean) => void;
  setShowBadges: (enabled: boolean) => void;
};

type ChatState = {
  messages: ChatMessage[];
  setMessages: (messages: ChatMessage[]) => void;
  appendMessage: (message: ChatMessage) => void;
  clearMessages: () => void;
};

export const useSettingsStore = create<SettingsState>((set) => ({
  showTimestamps: true,
  showBadges: true,
  setShowTimestamps: (enabled) => set({ showTimestamps: enabled }),
  setShowBadges: (enabled) => set({ showBadges: enabled })
}));

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  setMessages: (messages) => set({ messages }),
  appendMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  clearMessages: () => set({ messages: [] })
}));
