import { useMemo } from "react";
import type { ChatMessage } from "@multichat/chat-core";
import { useChatStore } from "../store";

export function useChat() {
  const messages = useChatStore((state) => state.messages);
  const setMessages = useChatStore((state) => state.setMessages);
  const appendMessage = useChatStore((state) => state.appendMessage);
  const clearMessages = useChatStore((state) => state.clearMessages);

  const stats = useMemo(
    () => ({
      total: messages.length
    }),
    [messages.length]
  );

  return {
    messages,
    setMessages: (nextMessages: ChatMessage[]) => setMessages(nextMessages),
    appendMessage: (message: ChatMessage) => appendMessage(message),
    clearMessages,
    stats
  };
}
