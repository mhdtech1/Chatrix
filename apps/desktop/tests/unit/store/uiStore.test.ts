import { beforeEach, describe, expect, it } from "vitest";
import { useUIStore } from "../../../src/renderer/store";

describe("useUIStore", () => {
  beforeEach(() => {
    useUIStore.getState().resetUiState();
  });

  it("supports direct and functional boolean updates", () => {
    useUIStore.getState().setMainMenuOpen(true);
    useUIStore.getState().setMainMenuOpen((previous) => !previous);
    useUIStore.getState().setCommandPaletteOpen(true);
    useUIStore.getState().setReadOnlyGuideMode(true);
    useUIStore.getState().setSetupWizardStep(2);

    const state = useUIStore.getState();
    expect(state.mainMenuOpen).toBe(false);
    expect(state.commandPaletteOpen).toBe(true);
    expect(state.readOnlyGuideMode).toBe(true);
    expect(state.setupWizardStep).toBe(2);
  });

  it("resets all ui flags", () => {
    useUIStore.getState().setQuickTourOpen(true);
    useUIStore.getState().setSetupWizardOpen(true);
    useUIStore.getState().setRebrandAnnouncementOpen(true);
    useUIStore.getState().setSetupWizardDismissed(true);
    useUIStore.getState().setSetupWizardStep(3);

    useUIStore.getState().resetUiState();
    const state = useUIStore.getState();
    expect(state.quickTourOpen).toBe(false);
    expect(state.setupWizardOpen).toBe(false);
    expect(state.rebrandAnnouncementOpen).toBe(false);
    expect(state.setupWizardDismissed).toBe(false);
    expect(state.setupWizardStep).toBe(0);
    expect(state.mainMenuOpen).toBe(false);
    expect(state.commandPaletteOpen).toBe(false);
  });
});
