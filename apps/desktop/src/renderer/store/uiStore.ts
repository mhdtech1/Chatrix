import { create } from "zustand";

type Updater<T> = T | ((previous: T) => T);

type UiStoreState = {
  commandPaletteOpen: boolean;
  mainMenuOpen: boolean;
  quickTourOpen: boolean;
  readOnlyGuideMode: boolean;
  rebrandAnnouncementOpen: boolean;
  setupWizardDismissed: boolean;
  setupWizardStep: number;
  setupWizardOpen: boolean;
  setCommandPaletteOpen: (updater: Updater<boolean>) => void;
  setMainMenuOpen: (updater: Updater<boolean>) => void;
  setQuickTourOpen: (updater: Updater<boolean>) => void;
  setReadOnlyGuideMode: (updater: Updater<boolean>) => void;
  setRebrandAnnouncementOpen: (updater: Updater<boolean>) => void;
  setSetupWizardDismissed: (updater: Updater<boolean>) => void;
  setSetupWizardStep: (updater: Updater<number>) => void;
  setSetupWizardOpen: (updater: Updater<boolean>) => void;
  resetUiState: () => void;
};

const applyUpdater = <T>(previous: T, updater: Updater<T>): T =>
  typeof updater === "function"
    ? (updater as (previousState: T) => T)(previous)
    : updater;

export const useUIStore = create<UiStoreState>((set) => ({
  commandPaletteOpen: false,
  mainMenuOpen: false,
  quickTourOpen: false,
  readOnlyGuideMode: false,
  rebrandAnnouncementOpen: false,
  setupWizardDismissed: false,
  setupWizardStep: 0,
  setupWizardOpen: false,
  setCommandPaletteOpen: (updater) =>
    set((state) => ({
      commandPaletteOpen: applyUpdater(state.commandPaletteOpen, updater),
    })),
  setMainMenuOpen: (updater) =>
    set((state) => ({
      mainMenuOpen: applyUpdater(state.mainMenuOpen, updater),
    })),
  setQuickTourOpen: (updater) =>
    set((state) => ({
      quickTourOpen: applyUpdater(state.quickTourOpen, updater),
    })),
  setReadOnlyGuideMode: (updater) =>
    set((state) => ({
      readOnlyGuideMode: applyUpdater(state.readOnlyGuideMode, updater),
    })),
  setRebrandAnnouncementOpen: (updater) =>
    set((state) => ({
      rebrandAnnouncementOpen: applyUpdater(
        state.rebrandAnnouncementOpen,
        updater,
      ),
    })),
  setSetupWizardDismissed: (updater) =>
    set((state) => ({
      setupWizardDismissed: applyUpdater(state.setupWizardDismissed, updater),
    })),
  setSetupWizardStep: (updater) =>
    set((state) => ({
      setupWizardStep: applyUpdater(state.setupWizardStep, updater),
    })),
  setSetupWizardOpen: (updater) =>
    set((state) => ({
      setupWizardOpen: applyUpdater(state.setupWizardOpen, updater),
    })),
  resetUiState: () =>
    set({
      commandPaletteOpen: false,
      mainMenuOpen: false,
      quickTourOpen: false,
      readOnlyGuideMode: false,
      rebrandAnnouncementOpen: false,
      setupWizardDismissed: false,
      setupWizardStep: 0,
      setupWizardOpen: false,
    }),
}));
