import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  migrateLegacySettingsTokens,
  hydrateTokenStateFromSecureStorage,
  getSecureStorage,
} from "../../../src/main/services/secureStorage.js";

// Mock keytar to avoid issues in environment and to simulate latency
vi.mock("keytar", () => {
  const store = new Map<string, string>();
  return {
    default: {
      findCredentials: vi.fn(async () => []),
      setPassword: vi.fn(async (_service, account, password) => {
        await new Promise((resolve) => setTimeout(resolve, 10)); // Add simulated I/O latency
        store.set(account, password);
      }),
      getPassword: vi.fn(async (_service, account) => {
        await new Promise((resolve) => setTimeout(resolve, 10)); // Add simulated I/O latency
        return store.get(account) || null;
      }),
      deletePassword: vi.fn(async (_service, account) => {
        await new Promise((resolve) => setTimeout(resolve, 10)); // Add simulated I/O latency
        return store.delete(account);
      }),
    },
  };
});

describe("secureStorage performance and correctness", () => {
  beforeEach(() => {
    // Reset the secureStorage cache and internal state if possible
    // Since it's a singleton, we might need to be careful.
    // For testing, we'll just ensure it's using the mocked keytar.
    const storage = getSecureStorage();
    // @ts-ignore - access private cache for reset
    storage.cache.clear();
    // @ts-ignore
    storage.cacheLoaded = false;
  });

  it("migrateLegacySettingsTokens should correctly migrate tokens", async () => {
    const mockStore = {
      data: {
        twitchToken: "legacy-twitch-token",
        kickAccessToken: "legacy-kick-access",
        kickRefreshToken: "legacy-kick-refresh",
      } as Record<string, string>,
      get(key: string) {
        return this.data[key];
      },
      set: vi.fn(),
    };

    const start = Date.now();
    // @ts-ignore
    await migrateLegacySettingsTokens(mockStore);
    const end = Date.now();
    console.info(`migrateLegacySettingsTokens took ${end - start}ms`);

    const twitchTokens = await (await import("../../../src/main/services/secureStorage.js")).getAuthTokens("twitch");
    expect(twitchTokens.accessToken).toBe("legacy-twitch-token");

    const kickTokens = await (await import("../../../src/main/services/secureStorage.js")).getAuthTokens("kick");
    expect(kickTokens.accessToken).toBe("legacy-kick-access");
    expect(kickTokens.refreshToken).toBe("legacy-kick-refresh");
  });

  it("hydrateTokenStateFromSecureStorage should correctly hydrate tokens", async () => {
    // Pre-fill storage
    await (await import("../../../src/main/services/secureStorage.js")).storeAuthTokens("twitch", {
      accessToken: "secure-twitch-token",
    });
    await (await import("../../../src/main/services/secureStorage.js")).storeAuthTokens("kick", {
      accessToken: "secure-kick-access",
      refreshToken: "secure-kick-refresh",
    });

    const mockStore = {
      data: {} as Record<string, string>,
      get: vi.fn(),
      set: vi.fn((updates) => {
        Object.assign(mockStore.data, updates);
      }),
    };

    const start = Date.now();
    // @ts-ignore
    await hydrateTokenStateFromSecureStorage(mockStore);
    const end = Date.now();
    console.info(`hydrateTokenStateFromSecureStorage took ${end - start}ms`);

    expect(mockStore.data.twitchToken).toBe("secure-twitch-token");
    expect(mockStore.data.kickAccessToken).toBe("secure-kick-access");
    expect(mockStore.data.kickRefreshToken).toBe("secure-kick-refresh");
  });
});
