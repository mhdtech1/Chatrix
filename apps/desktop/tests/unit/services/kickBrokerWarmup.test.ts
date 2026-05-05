import { afterEach, describe, expect, it, vi } from "vitest";
import {
  KICK_BROKER_KEEPALIVE_INTERVAL_MS,
  KICK_BROKER_SECOND_WARMUP_DELAY_MS,
  createKickBrokerWarmupScheduler,
} from "../../../src/main/services/kickBrokerWarmup";

describe("kick broker warmup scheduler", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("warms once immediately and a second time five minutes after startup", () => {
    vi.useFakeTimers();
    const warm = vi.fn();
    const scheduler = createKickBrokerWarmupScheduler({
      isEnabled: () => true,
      warm,
    });

    scheduler.start();

    expect(warm).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(KICK_BROKER_SECOND_WARMUP_DELAY_MS - 1);
    expect(warm).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(1);
    expect(warm).toHaveBeenCalledTimes(2);
  });

  it("continues normal keepalive pings after the delayed startup warm", () => {
    vi.useFakeTimers();
    const warm = vi.fn();
    const scheduler = createKickBrokerWarmupScheduler({
      isEnabled: () => true,
      warm,
    });

    scheduler.start();
    vi.advanceTimersByTime(KICK_BROKER_SECOND_WARMUP_DELAY_MS);
    vi.advanceTimersByTime(
      KICK_BROKER_KEEPALIVE_INTERVAL_MS - KICK_BROKER_SECOND_WARMUP_DELAY_MS,
    );

    expect(warm).toHaveBeenCalledTimes(3);
  });

  it("does not schedule duplicate startup timers", () => {
    vi.useFakeTimers();
    const warm = vi.fn();
    const scheduler = createKickBrokerWarmupScheduler({
      isEnabled: () => true,
      warm,
    });

    scheduler.start();
    scheduler.start();
    vi.advanceTimersByTime(KICK_BROKER_SECOND_WARMUP_DELAY_MS);

    expect(warm).toHaveBeenCalledTimes(2);
  });

  it("stops pending delayed and keepalive pings", () => {
    vi.useFakeTimers();
    const warm = vi.fn();
    const scheduler = createKickBrokerWarmupScheduler({
      isEnabled: () => true,
      warm,
    });

    scheduler.start();
    scheduler.stop();
    vi.advanceTimersByTime(KICK_BROKER_KEEPALIVE_INTERVAL_MS * 2);

    expect(warm).toHaveBeenCalledTimes(1);
  });

  it("does not ping when the broker is not configured", () => {
    vi.useFakeTimers();
    const warm = vi.fn();
    const scheduler = createKickBrokerWarmupScheduler({
      isEnabled: () => false,
      warm,
    });

    scheduler.start();
    vi.advanceTimersByTime(KICK_BROKER_KEEPALIVE_INTERVAL_MS);

    expect(warm).not.toHaveBeenCalled();
  });
});
