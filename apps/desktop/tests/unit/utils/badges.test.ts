import { describe, expect, it } from "vitest";
import {
  kickRoleBadgeKeysForBadge,
  resolveKickBadgeAsset,
} from "../../../src/renderer/utils/badges";

describe("kick badge utilities", () => {
  it("resolves canonical Kick badge assets", () => {
    expect(resolveKickBadgeAsset("subgifter_25")?.imageUrl).toContain(
      "subGifter25.svg",
    );
    expect(resolveKickBadgeAsset("unknown-badge")).toBeNull();
  });

  it("maps Kick badges to UI role badges", () => {
    expect(kickRoleBadgeKeysForBadge("owner")).toEqual(["broadcaster"]);
    expect(kickRoleBadgeKeysForBadge("partner")).toEqual(["verified"]);
    expect(kickRoleBadgeKeysForBadge("founder")).toEqual(["subscriber"]);
  });
});
