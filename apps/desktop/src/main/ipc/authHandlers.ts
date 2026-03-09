import { IPC_CHANNELS } from "../../shared/constants.js";
import type { AuthHealthSnapshot } from "../../shared/types.js";
import type { JsonSettingsStore } from "../services/settingsStore.js";
import type { IpcHandlerRegistry } from "./handlers.js";

type CreateAuthHealthHandlersOptions = {
  getAuthHealthSnapshot: () => Promise<AuthHealthSnapshot>;
};

type AuthTokenPlatform = "twitch" | "kick" | "youtube";

type CreateAuthSessionHandlersOptions = {
  store: JsonSettingsStore;
  twitchScopeVersion: number;
  kickScopeVersion: number;
  clearAuthTokens: (platform: AuthTokenPlatform) => Promise<void>;
  refreshKickAccessToken: () => Promise<unknown>;
  onYouTubeSignedOut: () => void;
};

export function createAuthHealthHandlers(
  options: CreateAuthHealthHandlersOptions,
): IpcHandlerRegistry {
  const { getAuthHealthSnapshot } = options;

  return {
    [IPC_CHANNELS.AUTH_GET_HEALTH]: async () => getAuthHealthSnapshot(),
    [IPC_CHANNELS.AUTH_TEST_PERMISSIONS]: async () => getAuthHealthSnapshot(),
  };
}

export function createAuthSessionHandlers(
  options: CreateAuthSessionHandlersOptions,
): IpcHandlerRegistry {
  const {
    store,
    twitchScopeVersion,
    kickScopeVersion,
    clearAuthTokens,
    refreshKickAccessToken,
    onYouTubeSignedOut,
  } = options;

  return {
    [IPC_CHANNELS.AUTH_TWITCH_SIGN_OUT]: async () => {
      store.set({
        twitchToken: "",
        twitchUsername: "",
        twitchGuest: false,
        twitchScopeVersion,
      });
      await clearAuthTokens("twitch");
      return store.store;
    },
    [IPC_CHANNELS.AUTH_KICK_SIGN_OUT]: async () => {
      store.set({
        kickAccessToken: "",
        kickRefreshToken: "",
        kickUsername: "",
        kickGuest: false,
        kickScopeVersion,
      });
      await clearAuthTokens("kick");
      return store.store;
    },
    [IPC_CHANNELS.AUTH_KICK_REFRESH]: async () => {
      await refreshKickAccessToken();
      return store.store;
    },
    [IPC_CHANNELS.AUTH_YOUTUBE_SIGN_OUT]: async () => {
      store.set({
        youtubeAccessToken: "",
        youtubeRefreshToken: "",
        youtubeTokenExpiry: 0,
        youtubeUsername: "",
        youtubeLiveChatId: "",
      });
      onYouTubeSignedOut();
      await clearAuthTokens("youtube");
      return store.store;
    },
  };
}
