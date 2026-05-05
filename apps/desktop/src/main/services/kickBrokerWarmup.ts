export type KickBrokerWarmupScheduler = {
  start: () => void;
  stop: () => void;
};

export type KickBrokerWarmupOptions = {
  isEnabled: () => boolean;
  warm: () => void;
  secondWarmupDelayMs?: number;
  keepAliveIntervalMs?: number;
  setTimeoutFn?: typeof setTimeout;
  clearTimeoutFn?: typeof clearTimeout;
  setIntervalFn?: typeof setInterval;
  clearIntervalFn?: typeof clearInterval;
};

export const KICK_BROKER_SECOND_WARMUP_DELAY_MS = 5 * 60 * 1000;
export const KICK_BROKER_KEEPALIVE_INTERVAL_MS = 10 * 60 * 1000;

export const createKickBrokerWarmupScheduler = ({
  isEnabled,
  warm,
  secondWarmupDelayMs = KICK_BROKER_SECOND_WARMUP_DELAY_MS,
  keepAliveIntervalMs = KICK_BROKER_KEEPALIVE_INTERVAL_MS,
  setTimeoutFn = setTimeout,
  clearTimeoutFn = clearTimeout,
  setIntervalFn = setInterval,
  clearIntervalFn = clearInterval,
}: KickBrokerWarmupOptions): KickBrokerWarmupScheduler => {
  let secondWarmupTimer: ReturnType<typeof setTimeout> | null = null;
  let keepAliveTimer: ReturnType<typeof setInterval> | null = null;

  const clearTimers = () => {
    if (secondWarmupTimer) {
      clearTimeoutFn(secondWarmupTimer);
      secondWarmupTimer = null;
    }
    if (keepAliveTimer) {
      clearIntervalFn(keepAliveTimer);
      keepAliveTimer = null;
    }
  };

  return {
    start: () => {
      if (secondWarmupTimer || keepAliveTimer || !isEnabled()) {
        return;
      }

      warm();
      secondWarmupTimer = setTimeoutFn(() => {
        secondWarmupTimer = null;
        if (isEnabled()) {
          warm();
        }
      }, secondWarmupDelayMs);
      keepAliveTimer = setIntervalFn(() => {
        if (isEnabled()) {
          warm();
        }
      }, keepAliveIntervalMs);
    },
    stop: clearTimers,
  };
};
