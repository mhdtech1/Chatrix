import { describe, it, expect } from "vitest";
import { createInitialUpdateStatus } from "../../../src/main/services/updater.js";

describe("createInitialUpdateStatus", () => {
  it("creates initial update status for stable channel", () => {
    const status = createInitialUpdateStatus("1.0.0", "stable");
    expect(status).toEqual({
      state: "idle",
      message: "Checking for updates shortly...",
      channel: "stable",
      currentVersion: "1.0.0",
    });
  });

  it("creates initial update status for beta channel", () => {
    const status = createInitialUpdateStatus("2.0.0-beta.1", "beta");
    expect(status).toEqual({
      state: "idle",
      message: "Checking for updates shortly...",
      channel: "beta",
      currentVersion: "2.0.0-beta.1",
    });
  });
});
