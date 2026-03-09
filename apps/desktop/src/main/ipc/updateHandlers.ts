import { IPC_CHANNELS } from "../../shared/constants.js";
import type { UpdateChannel, UpdateStatus } from "../../shared/types.js";
import type { JsonSettingsStore } from "../services/settingsStore.js";
import type { IpcHandlerRegistry } from "./handlers.js";

type CreateUpdateHandlersOptions = {
  store: JsonSettingsStore;
  isPackaged: boolean;
  devUpdateMessage: string;
  requestUpdateCheck: () => Promise<UpdateStatus>;
  downloadUpdate: () => Promise<unknown>;
  setUpdateStatus: (
    state: UpdateStatus["state"],
    message: string,
    partial?: Partial<UpdateStatus>,
  ) => void;
  applyAutoUpdaterChannel: (channel: UpdateChannel) => void;
  installDownloadedUpdateNow: () => void;
  getUpdateStatus: () => UpdateStatus;
};

export function createUpdateHandlers(
  options: CreateUpdateHandlersOptions,
): IpcHandlerRegistry {
  const {
    store,
    isPackaged,
    devUpdateMessage,
    requestUpdateCheck,
    downloadUpdate,
    setUpdateStatus,
    applyAutoUpdaterChannel,
    installDownloadedUpdateNow,
    getUpdateStatus,
  } = options;

  return {
    [IPC_CHANNELS.UPDATES_CHECK]: async () => requestUpdateCheck(),
    [IPC_CHANNELS.UPDATES_DOWNLOAD]: async () => {
      if (!isPackaged) {
        setUpdateStatus("not-available", devUpdateMessage);
        return;
      }
      try {
        setUpdateStatus("downloading", "Downloading update...");
        await downloadUpdate();
      } catch (error) {
        const text = error instanceof Error ? error.message : String(error);
        setUpdateStatus("error", `Update download failed: ${text}`);
      }
    },
    [IPC_CHANNELS.UPDATES_SET_CHANNEL]: async (_event, channel: unknown) => {
      const normalized: UpdateChannel = channel === "beta" ? "beta" : "stable";
      store.set({
        updateChannel: normalized,
      });
      applyAutoUpdaterChannel(normalized);
      return getUpdateStatus();
    },
    [IPC_CHANNELS.UPDATES_INSTALL]: () => {
      if (!isPackaged) {
        setUpdateStatus("not-available", devUpdateMessage);
        return;
      }
      installDownloadedUpdateNow();
    },
    [IPC_CHANNELS.UPDATES_GET_STATUS]: () => getUpdateStatus(),
  };
}
