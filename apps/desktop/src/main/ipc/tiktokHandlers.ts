import { IPC_CHANNELS } from "../../shared/constants.js";
import type { IpcHandlerRegistry } from "./handlers.js";

type CreateTikTokHandlersOptions = {
  connect: (channel: string) => Promise<{
    connectionId: string;
    roomId?: string;
  }>;
  disconnect: (connectionId: string) => Promise<void>;
  sendMessage: (payload: {
    connectionId?: string;
    message?: string;
  }) => Promise<void>;
};

export function createTikTokHandlers(
  options: CreateTikTokHandlersOptions,
): IpcHandlerRegistry {
  const { connect, disconnect, sendMessage } = options;
  return {
    [IPC_CHANNELS.TIKTOK_CONNECT]: async (_event, channel: unknown) => {
      const input = typeof channel === "string" ? channel : "";
      return connect(input);
    },
    [IPC_CHANNELS.TIKTOK_DISCONNECT]: async (_event, connectionId: unknown) => {
      const id = typeof connectionId === "string" ? connectionId : "";
      await disconnect(id);
    },
    [IPC_CHANNELS.TIKTOK_SEND_MESSAGE]: async (_event, payload: unknown) => {
      const request =
        payload && typeof payload === "object"
          ? (payload as { connectionId?: string; message?: string })
          : {};
      await sendMessage(request);
    },
  };
}
