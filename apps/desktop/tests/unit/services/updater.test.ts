import { describe, expect, it } from "vitest";
import { createInitialUpdateStatus } from "../../../src/main/services/updater";

describe("updater service", () => {
  describe("createInitialUpdateStatus", () => {
    it("creates correct initial status for stable channel", () => {
      const status = createInitialUpdateStatus("1.0.0", "stable");

      expect(status).toEqual({
        state: "idle",
        message: "Checking for updates shortly...",
        channel: "stable",
        currentVersion: "1.0.0"
      });
    });

    it("creates correct initial status for beta channel", () => {
      const status = createInitialUpdateStatus("2.0.0-beta.1", "beta");

      expect(status).toEqual({
        state: "idle",
        message: "Checking for updates shortly...",
        channel: "beta",
        currentVersion: "2.0.0-beta.1"
      });
    });
  });
});
