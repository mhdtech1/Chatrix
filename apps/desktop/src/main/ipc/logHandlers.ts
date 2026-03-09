import { IPC_CHANNELS } from "../../shared/constants.js";
import type { JsonSettingsStore } from "../services/settingsStore.js";
import type { IpcHandlerRegistry } from "./handlers.js";

type CreateLogHandlersOptions = {
  store: JsonSettingsStore;
  writeLog: (message: string) => void;
};

export function createLogHandlers(
  options: CreateLogHandlersOptions,
): IpcHandlerRegistry {
  const { store, writeLog } = options;

  return {
    [IPC_CHANNELS.LOG_WRITE]: (_event, message: unknown) => {
      const text =
        typeof message === "string" ? message : String(message ?? "");
      if (store.get("verboseLogs")) {
        writeLog(text);
      }
    },
    [IPC_CHANNELS.LOG_TOGGLE]: (_event, enabled: unknown) => {
      store.set("verboseLogs", Boolean(enabled));
    },
  };
}
