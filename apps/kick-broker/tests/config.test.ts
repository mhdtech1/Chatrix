import { describe, expect, it } from "vitest";
import {
  isAllowedRedirectUri,
  loadBrokerConfig,
  parseKickExchangeRequest,
  parseKickRefreshRequest,
} from "../src/config.js";

describe("kick broker config", () => {
  it("loads config with sane defaults", () => {
    const config = loadBrokerConfig({
      KICK_CLIENT_ID: "kick-client",
      KICK_CLIENT_SECRET: "kick-secret",
    });

    expect(config.port).toBe(3001);
    expect(config.host).toBe("127.0.0.1");
    expect(config.allowedRedirectPrefixes).toEqual([
      "http://localhost:51730/",
      "http://127.0.0.1:51730/",
    ]);
    expect(config.allowedOrigins).toEqual([]);
    expect(config.maxBodyBytes).toBe(8 * 1024);
    expect(config.rateLimitWindowMs).toBe(60_000);
    expect(config.rateLimitMaxRequests).toBe(60);
  });

  it("uses hosted defaults when PORT is provided", () => {
    const config = loadBrokerConfig({
      KICK_CLIENT_ID: "kick-client",
      KICK_CLIENT_SECRET: "kick-secret",
      PORT: "10000",
    });

    expect(config.port).toBe(10000);
    expect(config.host).toBe("0.0.0.0");
  });

  it("accepts localhost redirect URIs only when configured", () => {
    expect(
      isAllowedRedirectUri("http://localhost:51730/kick/callback", [
        "http://localhost:51730/",
      ]),
    ).toBe(true);
    expect(
      isAllowedRedirectUri("https://evil.example.com/kick/callback", [
        "http://localhost:51730/",
      ]),
    ).toBe(false);
  });

  it("normalizes configured allowed origins", () => {
    const config = loadBrokerConfig({
      KICK_CLIENT_ID: "kick-client",
      KICK_CLIENT_SECRET: "kick-secret",
      KICK_BROKER_ALLOWED_ORIGINS:
        "https://app.example.com, http://localhost:3000",
    });

    expect(config.allowedOrigins).toEqual([
      "https://app.example.com",
      "http://localhost:3000",
    ]);
  });

  it("throws when required environment variables are missing", () => {
    expect(() => loadBrokerConfig({ KICK_CLIENT_SECRET: "secret" })).toThrow(
      "KICK_CLIENT_ID is required for the Kick broker.",
    );
    expect(() => loadBrokerConfig({ KICK_CLIENT_ID: "client" })).toThrow(
      "KICK_CLIENT_SECRET is required for the Kick broker.",
    );
  });

  it("throws when port is invalid", () => {
    expect(() =>
      loadBrokerConfig({
        KICK_CLIENT_ID: "client",
        KICK_CLIENT_SECRET: "secret",
        KICK_BROKER_PORT: "invalid",
      }),
    ).toThrow("KICK_BROKER_PORT must be a valid TCP port.");

    expect(() =>
      loadBrokerConfig({
        KICK_CLIENT_ID: "client",
        KICK_CLIENT_SECRET: "secret",
        KICK_BROKER_PORT: "0",
      }),
    ).toThrow("KICK_BROKER_PORT must be a valid TCP port.");

    expect(() =>
      loadBrokerConfig({
        KICK_CLIENT_ID: "client",
        KICK_CLIENT_SECRET: "secret",
        KICK_BROKER_PORT: "70000",
      }),
    ).toThrow("KICK_BROKER_PORT must be a valid TCP port.");
  });

  it("resolves host based on environment", () => {
    expect(
      loadBrokerConfig({
        KICK_CLIENT_ID: "client",
        KICK_CLIENT_SECRET: "secret",
        KICK_BROKER_HOST: "10.0.0.1",
      }).host,
    ).toBe("10.0.0.1");

    expect(
      loadBrokerConfig({
        KICK_CLIENT_ID: "client",
        KICK_CLIENT_SECRET: "secret",
        RENDER: "true",
      }).host,
    ).toBe("0.0.0.0");
  });

  it("throws when redirect prefixes contain invalid URLs", () => {
    expect(() =>
      loadBrokerConfig({
        KICK_CLIENT_ID: "client",
        KICK_CLIENT_SECRET: "secret",
        KICK_BROKER_ALLOWED_REDIRECT_PREFIXES: "not-a-url",
      }),
    ).toThrow(
      "KICK_BROKER_ALLOWED_REDIRECT_PREFIXES contains an invalid URL: not-a-url",
    );

    expect(() =>
      loadBrokerConfig({
        KICK_CLIENT_ID: "client",
        KICK_CLIENT_SECRET: "secret",
        KICK_BROKER_ALLOWED_REDIRECT_PREFIXES: "ftp://localhost",
      }),
    ).toThrow(
      "KICK_BROKER_ALLOWED_REDIRECT_PREFIXES must use http or https: ftp://localhost",
    );
  });

  it("throws when allowed origins contain invalid URLs", () => {
    expect(() =>
      loadBrokerConfig({
        KICK_CLIENT_ID: "client",
        KICK_CLIENT_SECRET: "secret",
        KICK_BROKER_ALLOWED_ORIGINS: "not-a-url",
      }),
    ).toThrow("KICK_BROKER_ALLOWED_ORIGINS contains an invalid URL: not-a-url");

    expect(() =>
      loadBrokerConfig({
        KICK_CLIENT_ID: "client",
        KICK_CLIENT_SECRET: "secret",
        KICK_BROKER_ALLOWED_ORIGINS: "ftp://localhost",
      }),
    ).toThrow("KICK_BROKER_ALLOWED_ORIGINS must use http or https: ftp://localhost");
  });

  it("throws when positive integer configs are invalid", () => {
    const baseEnv = { KICK_CLIENT_ID: "client", KICK_CLIENT_SECRET: "secret" };

    expect(() =>
      loadBrokerConfig({ ...baseEnv, KICK_BROKER_MAX_BODY_BYTES: "-1" }),
    ).toThrow("KICK_BROKER_MAX_BODY_BYTES must be a positive integer.");

    expect(() =>
      loadBrokerConfig({ ...baseEnv, KICK_BROKER_MAX_BODY_BYTES: "0" }),
    ).toThrow("KICK_BROKER_MAX_BODY_BYTES must be a positive integer.");

    expect(() =>
      loadBrokerConfig({ ...baseEnv, KICK_BROKER_RATE_LIMIT_WINDOW_MS: "foo" }),
    ).toThrow("KICK_BROKER_RATE_LIMIT_WINDOW_MS must be a positive integer.");

    expect(() =>
      loadBrokerConfig({ ...baseEnv, KICK_BROKER_RATE_LIMIT_MAX_REQUESTS: "1.5" }),
    ).toThrow("KICK_BROKER_RATE_LIMIT_MAX_REQUESTS must be a positive integer.");
  });

  it("validates exchange requests", () => {
    expect(
      parseKickExchangeRequest({
        code: "abc",
        clientId: "client",
        redirectUri: "http://localhost:51730/kick/callback",
        codeVerifier: "verifier",
      }),
    ).toEqual({
      code: "abc",
      clientId: "client",
      redirectUri: "http://localhost:51730/kick/callback",
      codeVerifier: "verifier",
    });
  });

  it("validates refresh requests", () => {
    expect(
      parseKickRefreshRequest({
        refreshToken: "refresh",
        clientId: "client",
      }),
    ).toEqual({
      refreshToken: "refresh",
      clientId: "client",
    });
  });
});
