import { describe, expect, it, vi } from "vitest";
import { IPC_CHANNELS } from "../../../src/shared/constants";
import type { AppSettings } from "../../../src/shared/types";
import { createLogHandlers } from "../../../src/main/ipc/logHandlers";

const createMockSettingsStore = (initialState: AppSettings = {}) => {
  let state: AppSettings = { ...initialState };

  return {
    get<K extends keyof AppSettings>(key: K): AppSettings[K] {
      return state[key];
    },
    set<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
      state = { ...state, [key]: value };
    },
  };
};

describe("createLogHandlers", () => {
  it("only writes logs when verbose mode is enabled", async () => {
    const store = createMockSettingsStore({ verboseLogs: false });
    const writeLog = vi.fn();

    const handlers = createLogHandlers({
      store: store as never,
      writeLog,
    });

    await handlers[IPC_CHANNELS.LOG_WRITE]({} as never, "hidden log" as never);
    expect(writeLog).not.toHaveBeenCalled();

    await handlers[IPC_CHANNELS.LOG_TOGGLE]({} as never, true as never);
    await handlers[IPC_CHANNELS.LOG_WRITE]({} as never, "visible log" as never);
    expect(writeLog).toHaveBeenCalledWith("visible log");
  });
});

