import { describe, expect, it, vi } from "vitest";
import { IPC_CHANNELS } from "../../../src/shared/constants";
import type { AppSettings, UpdateStatus } from "../../../src/shared/types";
import { createUpdateHandlers } from "../../../src/main/ipc/updateHandlers";

const createMockSettingsStore = (initialState: AppSettings = {}) => {
  let state: AppSettings = { ...initialState };

  return {
    get store() {
      return { ...state };
    },
    get<K extends keyof AppSettings>(key: K): AppSettings[K] {
      return state[key];
    },
    set(updates: Partial<AppSettings>) {
      state = { ...state, ...updates };
    },
  };
};

describe("createUpdateHandlers", () => {
  const currentStatus: UpdateStatus = {
    state: "idle",
    message: "",
    channel: "stable",
    currentVersion: "1.0.2",
  };

  it("sets update channel and returns current status", async () => {
    const store = createMockSettingsStore({ updateChannel: "stable" });
    const applyAutoUpdaterChannel = vi.fn();

    const handlers = createUpdateHandlers({
      store: store as never,
      isPackaged: false,
      devUpdateMessage: "dev-only",
      requestUpdateCheck: vi.fn().mockResolvedValue(currentStatus),
      downloadUpdate: vi.fn().mockResolvedValue(undefined),
      setUpdateStatus: vi.fn(),
      applyAutoUpdaterChannel,
      installDownloadedUpdateNow: vi.fn(),
      getUpdateStatus: () => currentStatus,
    });

    const result = await handlers[IPC_CHANNELS.UPDATES_SET_CHANNEL](
      {} as never,
      "beta" as never,
    );

    expect(result).toEqual(currentStatus);
    expect(store.store.updateChannel).toBe("beta");
    expect(applyAutoUpdaterChannel).toHaveBeenCalledWith("beta");
  });

  it("blocks download/install in unpackaged builds", async () => {
    const store = createMockSettingsStore({ updateChannel: "stable" });
    const setUpdateStatus = vi.fn();
    const downloadUpdate = vi.fn();
    const installDownloadedUpdateNow = vi.fn();

    const handlers = createUpdateHandlers({
      store: store as never,
      isPackaged: false,
      devUpdateMessage: "dev-only",
      requestUpdateCheck: vi.fn().mockResolvedValue(currentStatus),
      downloadUpdate,
      setUpdateStatus,
      applyAutoUpdaterChannel: vi.fn(),
      installDownloadedUpdateNow,
      getUpdateStatus: () => currentStatus,
    });

    await handlers[IPC_CHANNELS.UPDATES_DOWNLOAD]({} as never, undefined as never);
    await handlers[IPC_CHANNELS.UPDATES_INSTALL]({} as never, undefined as never);

    expect(downloadUpdate).not.toHaveBeenCalled();
    expect(installDownloadedUpdateNow).not.toHaveBeenCalled();
    expect(setUpdateStatus).toHaveBeenCalledWith("not-available", "dev-only");
  });
});

