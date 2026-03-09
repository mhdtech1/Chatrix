import { create } from "zustand";
import type { AppSettings } from "../../shared/types";

type SettingsUpdater = AppSettings | ((previous: AppSettings) => AppSettings);

type AppSettingsStoreState = {
  settings: AppSettings;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  setSettings: (updater: SettingsUpdater) => void;
  patchSettings: (updates: Partial<AppSettings>) => void;
  resetSettings: () => void;
};

const DEFAULT_SETTINGS: AppSettings = {};

export const useAppSettingsStore = create<AppSettingsStoreState>((set) => ({
  settings: DEFAULT_SETTINGS,
  loading: true,
  setLoading: (loading) => set({ loading }),
  setSettings: (updater) =>
    set((state) => ({
      settings:
        typeof updater === "function"
          ? (updater as (previous: AppSettings) => AppSettings)(state.settings)
          : updater,
    })),
  patchSettings: (updates) =>
    set((state) => ({
      settings: {
        ...state.settings,
        ...updates,
      },
    })),
  resetSettings: () =>
    set({
      settings: DEFAULT_SETTINGS,
      loading: true,
    }),
}));
