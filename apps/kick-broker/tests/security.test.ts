import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import type { BrokerConfig } from "../src/config.js";
import { createKickBrokerServer } from "../src/server.js";

const baseConfig: BrokerConfig = {
  port: 3001,
  host: "127.0.0.1",
  kickClientId: "kick-client",
  kickClientSecret: "kick-secret",
  allowedRedirectPrefixes: ["http://localhost:51730/"],
  allowedOrigins: [],
  maxBodyBytes: 8 * 1024,
  rateLimitWindowMs: 60_000,
  rateLimitMaxRequests: 60,
};

const activeServers = new Set<Server>();

const startServer = async (overrides: Partial<BrokerConfig> = {}) => {
  const server = createKickBrokerServer({
    ...baseConfig,
    ...overrides,
  } as any);

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      server.removeListener("error", reject);
      resolve();
    });
  });

  activeServers.add(server);
  const address = server.address() as AddressInfo;
  return {
    server,
    baseUrl: `http://127.0.0.1:${address.port}`,
  };
};

afterEach(async () => {
  await Promise.all(
    [...activeServers].map(
      (server) =>
        new Promise<void>((resolve) => {
          server.close(() => resolve());
        }),
    ),
  );
  activeServers.clear();
});

describe("kick broker security", () => {
  it("prevents rate limit bypass via X-Forwarded-For by default (trustProxy: false)", async () => {
    const { baseUrl } = await startServer({
      rateLimitMaxRequests: 1,
      rateLimitWindowMs: 60_000,
      trustProxy: false,
    });

    const requestInit = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        clientId: "kick-client",
        refreshToken: "token",
      }),
    } satisfies RequestInit;

    // First request - consumes the limit
    const first = await fetch(`${baseUrl}/kick/refresh`, requestInit);
    expect(first.status).toBe(400);

    // Second request with DIFFERENT X-Forwarded-For - should STILL be rate limited because we don't trust the header
    const second = await fetch(`${baseUrl}/kick/refresh`, {
      ...requestInit,
      headers: {
        ...requestInit.headers,
        "X-Forwarded-For": "1.2.3.4",
      },
    });

    expect(second.status).toBe(429);
  });

  it("respects X-Forwarded-For when trustProxy is true", async () => {
    const { baseUrl } = await startServer({
      rateLimitMaxRequests: 1,
      rateLimitWindowMs: 60_000,
      trustProxy: true,
    });

    const requestInit = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        clientId: "kick-client",
        refreshToken: "token",
      }),
    } satisfies RequestInit;

    // First request
    const first = await fetch(`${baseUrl}/kick/refresh`, requestInit);
    expect(first.status).toBe(400);

    // Second request with DIFFERENT X-Forwarded-For - should NOT be rate limited because we trust the header
    const second = await fetch(`${baseUrl}/kick/refresh`, {
      ...requestInit,
      headers: {
        ...requestInit.headers,
        "X-Forwarded-For": "1.2.3.4",
      },
    });

    expect(second.status).toBe(400);
  });
});
