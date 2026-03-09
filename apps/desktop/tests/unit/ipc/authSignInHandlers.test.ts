import { describe, expect, it, vi } from "vitest";
import { IPC_CHANNELS } from "../../../src/shared/constants";
import type { AppSettings } from "../../../src/shared/types";
import {
  createAuthSignInHandlers,
  createAuthTikTokHandlers,
} from "../../../src/main/ipc/authHandlers";

const createMockSettingsStore = (initialState: AppSettings = {}) => {
  let state: AppSettings = { ...initialState };

  return {
    get store() {
      return { ...state };
    },
    get<K extends keyof AppSettings>(key: K): AppSettings[K] {
      return state[key];
    },
    set(updates: Partial<AppSettings>) {
      state = { ...state, ...updates };
    },
  };
};

const buildHandlers = (store: ReturnType<typeof createMockSettingsStore>) => {
  const clearAuthTokens = vi.fn().mockResolvedValue(undefined);
  const handlers = createAuthSignInHandlers({
    store: store as never,
    randomToken: vi.fn().mockReturnValue("token"),
    openAuthInBrowser: vi.fn(),
    fetchJsonOrThrow: vi.fn(),
    clearAuthTokens,
    storeAuthTokens: vi.fn().mockResolvedValue(undefined),
    parseKickUserName: vi.fn(),
    twitchDefaultRedirectUri: "http://localhost/twitch/callback",
    twitchScopes: ["chat:read"],
    twitchScopeVersion: 2,
    kickDefaultRedirectUri: "http://localhost/kick/callback",
    kickScopes: ["user:read"],
    kickScopeVersion: 3,
    youtubeScopes: ["scope"],
    youtubeMissingOauthMessage: "youtube oauth missing",
    assertYouTubeAlphaEnabled: vi.fn(),
    youtubeConfig: vi.fn().mockReturnValue({
      clientId: "",
      clientSecret: "",
      redirectUri: "http://localhost/youtube/callback",
    }),
    saveYouTubeTokens: vi.fn().mockResolvedValue(undefined),
    youtubeFetchWithAuth: vi.fn(),
  });
  return { handlers, clearAuthTokens };
};

describe("createAuthSignInHandlers", () => {
  it("falls back to twitch guest mode when no twitch client id is configured", async () => {
    const store = createMockSettingsStore({ twitchClientId: "" });
    const { handlers, clearAuthTokens } = buildHandlers(store);

    const result = await handlers[IPC_CHANNELS.AUTH_TWITCH_SIGN_IN](
      {} as never,
      undefined as never,
    );

    expect(clearAuthTokens).toHaveBeenCalledWith("twitch");
    expect(store.store.twitchGuest).toBe(true);
    expect(typeof store.store.twitchUsername).toBe("string");
    expect(result).toEqual(store.store);
  });

  it("throws for youtube sign-in when oauth client id is missing", async () => {
    const store = createMockSettingsStore();
    const { handlers } = buildHandlers(store);

    await expect(
      handlers[IPC_CHANNELS.AUTH_YOUTUBE_SIGN_IN](
        {} as never,
        undefined as never,
      ),
    ).rejects.toThrow("youtube oauth missing");
  });

  it("retries kick token exchange without client_secret after invalid client error", async () => {
    const originalFetch = globalThis.fetch;
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "invalid_client" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ access_token: "kick-access", refresh_token: "kick-refresh" }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: [{ username: "kick-user" }] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    globalThis.fetch = fetchMock as typeof fetch;

    try {
      const store = createMockSettingsStore({
        kickClientId: "kick-client",
        kickClientSecret: "bad-secret",
        kickRedirectUri: "http://localhost/kick/callback",
      });
      const storeAuthTokens = vi.fn().mockResolvedValue(undefined);
      const handlers = createAuthSignInHandlers({
        store: store as never,
        randomToken: vi
          .fn()
          .mockReturnValueOnce("kick-state")
          .mockReturnValueOnce("kick-verifier"),
        openAuthInBrowser: vi
          .fn()
          .mockResolvedValue(
            "http://localhost/kick/callback?code=kick-code&state=kick-state",
          ),
        fetchJsonOrThrow: async <T,>(response: Response, source: string) => {
          const text = await response.text();
          const parsed = text ? JSON.parse(text) : {};
          if (!response.ok) {
            const message =
              typeof parsed.error === "string"
                ? parsed.error
                : `${source} failed (${response.status})`;
            throw new Error(message);
          }
          return parsed as T;
        },
        clearAuthTokens: vi.fn().mockResolvedValue(undefined),
        storeAuthTokens,
        parseKickUserName: vi.fn().mockReturnValue("kick-user"),
        twitchDefaultRedirectUri: "http://localhost/twitch/callback",
        twitchScopes: ["chat:read"],
        twitchScopeVersion: 2,
        kickDefaultRedirectUri: "http://localhost/kick/callback",
        kickScopes: ["user:read"],
        kickScopeVersion: 3,
        youtubeScopes: ["scope"],
        youtubeMissingOauthMessage: "youtube oauth missing",
        assertYouTubeAlphaEnabled: vi.fn(),
        youtubeConfig: vi.fn().mockReturnValue({
          clientId: "",
          clientSecret: "",
          redirectUri: "http://localhost/youtube/callback",
        }),
        saveYouTubeTokens: vi.fn().mockResolvedValue(undefined),
        youtubeFetchWithAuth: vi.fn(),
      });

      await handlers[IPC_CHANNELS.AUTH_KICK_SIGN_IN](
        {} as never,
        undefined as never,
      );

      const firstBody = fetchMock.mock.calls[0]?.[1]?.body as URLSearchParams;
      const secondBody = fetchMock.mock.calls[1]?.[1]?.body as URLSearchParams;
      expect(firstBody.get("client_secret")).toBe("bad-secret");
      expect(secondBody.get("client_secret")).toBeNull();
      expect(storeAuthTokens).toHaveBeenCalledWith("kick", {
        accessToken: "kick-access",
        refreshToken: "kick-refresh",
      });
      expect(store.store.kickUsername).toBe("kick-user");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

describe("createAuthTikTokHandlers", () => {
  it("routes sign-in and sign-out to injected handlers", async () => {
    const signIn = vi.fn().mockResolvedValue({ ok: true });
    const signOut = vi.fn().mockResolvedValue({ ok: true });
    const handlers = createAuthTikTokHandlers({ signIn, signOut });

    await handlers[IPC_CHANNELS.AUTH_TIKTOK_SIGN_IN](
      {} as never,
      undefined as never,
    );
    await handlers[IPC_CHANNELS.AUTH_TIKTOK_SIGN_OUT](
      {} as never,
      undefined as never,
    );

    expect(signIn).toHaveBeenCalledTimes(1);
    expect(signOut).toHaveBeenCalledTimes(1);
  });
});
