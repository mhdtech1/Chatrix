import { beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";

vi.mock("node:fs", () => ({
  default: {
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
    mkdirSync: vi.fn()
  }
}));

describe("JsonSettingsStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty object when settings file does not exist", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    const { JsonSettingsStore } = await import("../../src/main/services/settingsStore");
    const store = new JsonSettingsStore({});
    expect(store.getAll()).toEqual({});
  });

  it("reads existing settings from disk", async () => {
    const mockSettings = { theme: "dark", welcomeMode: true };
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockSettings) as any);
    const { JsonSettingsStore } = await import("../../src/main/services/settingsStore");
    const store = new JsonSettingsStore({});
    expect(store.getAll()).toMatchObject(mockSettings);
  });

  it("omits sensitive token keys when persisting to disk", async () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    const { JsonSettingsStore } = await import("../../src/main/services/settingsStore");
    const store = new JsonSettingsStore({});
    store.set({
      twitchToken: "secret-token",
      theme: "light"
    });

    const [, serialized] = vi.mocked(fs.writeFileSync).mock.calls.at(-1) ?? [];
    expect(String(serialized)).toContain("\"theme\": \"light\"");
    expect(String(serialized)).not.toContain("twitchToken");
  });
});
