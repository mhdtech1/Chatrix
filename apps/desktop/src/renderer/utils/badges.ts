export type TwitchBadgeAsset = {
  key: string;
  setId: string;
  versionId: string;
  title: string;
  imageUrl: string;
};

const normalizeKickBadgeAssetKey = (rawBadge: string) =>
  rawBadge
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

const buildKickBadgeAsset = (
  key: string,
  title: string,
  slug = key,
): TwitchBadgeAsset => ({
  key: `kick:${key}`,
  setId: key,
  versionId: "1",
  title,
  imageUrl: `https://www.kickdatabase.com/kickBadges/${slug}.svg`,
});

const KICK_BADGE_ASSET_BY_CANONICAL_KEY: Record<string, TwitchBadgeAsset> = {
  trainwreckstv: buildKickBadgeAsset("trainwreckstv", "Trainwreckstv"),
  staff: buildKickBadgeAsset("staff", "Staff"),
  verified: buildKickBadgeAsset("verified", "Verified"),
  sidekick: buildKickBadgeAsset("sidekick", "Sidekick"),
  broadcaster: buildKickBadgeAsset("broadcaster", "Broadcaster"),
  moderator: buildKickBadgeAsset("moderator", "Moderator"),
  vip: buildKickBadgeAsset("vip", "VIP"),
  og: buildKickBadgeAsset("og", "OG"),
  founder: buildKickBadgeAsset("founder", "Founder"),
  subscriber: buildKickBadgeAsset("subscriber", "Subscriber"),
  subgifter: buildKickBadgeAsset("subgifter", "Gift Sub Gifter", "subGifter"),
  subgifter25: buildKickBadgeAsset(
    "subgifter25",
    "25 Gift Subs",
    "subGifter25",
  ),
  subgifter50: buildKickBadgeAsset(
    "subgifter50",
    "50 Gift Subs",
    "subGifter50",
  ),
  subgifter100: buildKickBadgeAsset(
    "subgifter100",
    "100 Gift Subs",
    "subGifter100",
  ),
  subgifter200: buildKickBadgeAsset(
    "subgifter200",
    "200 Gift Subs",
    "subGifter200",
  ),
};

const KICK_BADGE_CANONICAL_BY_KEY: Record<string, string> = {
  admin: "staff",
  broadcaster: "broadcaster",
  founder: "founder",
  globalmod: "moderator",
  mod: "moderator",
  moderator: "moderator",
  og: "og",
  owner: "broadcaster",
  partner: "verified",
  sidekick: "sidekick",
  staff: "staff",
  streamer: "broadcaster",
  sub: "subscriber",
  subscriber: "subscriber",
  subgift: "subgifter",
  subgifter: "subgifter",
  subgifter1: "subgifter",
  subgifter25: "subgifter25",
  subgifter50: "subgifter50",
  subgifter100: "subgifter100",
  subgifter200: "subgifter200",
  trainwreckstv: "trainwreckstv",
  verified: "verified",
  vip: "vip",
};

export const resolveKickBadgeAsset = (key: string): TwitchBadgeAsset | null => {
  const canonicalKey =
    KICK_BADGE_CANONICAL_BY_KEY[normalizeKickBadgeAssetKey(key)];
  if (!canonicalKey) return null;
  return KICK_BADGE_ASSET_BY_CANONICAL_KEY[canonicalKey] ?? null;
};

export const kickRoleBadgeKeysForBadge = (key: string): string[] => {
  const canonicalKey =
    KICK_BADGE_CANONICAL_BY_KEY[normalizeKickBadgeAssetKey(key)];
  if (!canonicalKey) return [];
  if (canonicalKey === "broadcaster") return ["broadcaster"];
  if (canonicalKey === "moderator") return ["moderator"];
  if (canonicalKey === "staff") return ["staff"];
  if (canonicalKey === "vip") return ["vip"];
  if (canonicalKey === "subscriber" || canonicalKey === "founder") {
    return ["subscriber"];
  }
  if (canonicalKey === "verified") return ["verified"];
  return [];
};
