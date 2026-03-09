import { describe, expect, it, vi } from "vitest";
import { IPC_CHANNELS } from "../../../src/shared/constants";
import { createTikTokHandlers } from "../../../src/main/ipc/tiktokHandlers";

describe("createTikTokHandlers", () => {
  it("routes connect/disconnect/send calls to injected handlers", async () => {
    const connect = vi.fn().mockResolvedValue({ connectionId: "abc" });
    const disconnect = vi.fn().mockResolvedValue(undefined);
    const sendMessage = vi.fn().mockResolvedValue(undefined);
    const handlers = createTikTokHandlers({
      connect,
      disconnect,
      sendMessage,
    });

    const connectResult = await handlers[IPC_CHANNELS.TIKTOK_CONNECT](
      {} as never,
      "streamer" as never,
    );
    await handlers[IPC_CHANNELS.TIKTOK_DISCONNECT](
      {} as never,
      "conn-1" as never,
    );
    await handlers[IPC_CHANNELS.TIKTOK_SEND_MESSAGE](
      {} as never,
      { connectionId: "conn-1", message: "hi" } as never,
    );

    expect(connect).toHaveBeenCalledWith("streamer");
    expect(connectResult).toEqual({ connectionId: "abc" });
    expect(disconnect).toHaveBeenCalledWith("conn-1");
    expect(sendMessage).toHaveBeenCalledWith({
      connectionId: "conn-1",
      message: "hi",
    });
  });

  it("normalizes malformed payloads", async () => {
    const connect = vi.fn().mockResolvedValue({ connectionId: "abc" });
    const disconnect = vi.fn().mockResolvedValue(undefined);
    const sendMessage = vi.fn().mockResolvedValue(undefined);
    const handlers = createTikTokHandlers({
      connect,
      disconnect,
      sendMessage,
    });

    await handlers[IPC_CHANNELS.TIKTOK_CONNECT]({} as never, 42 as never);
    await handlers[IPC_CHANNELS.TIKTOK_DISCONNECT]({} as never, null as never);
    await handlers[IPC_CHANNELS.TIKTOK_SEND_MESSAGE]({} as never, null as never);

    expect(connect).toHaveBeenCalledWith("");
    expect(disconnect).toHaveBeenCalledWith("");
    expect(sendMessage).toHaveBeenCalledWith({});
  });
});
