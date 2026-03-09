import { beforeEach, describe, expect, it } from "vitest";
import { useConnectionStore } from "../../../src/renderer/store";

describe("useConnectionStore", () => {
  beforeEach(() => {
    useConnectionStore.getState().resetConnectionState();
  });

  it("updates status and moderator maps with functional updaters", () => {
    useConnectionStore.getState().setStatusBySource((previous) => ({
      ...previous,
      sourceA: "connected",
    }));
    useConnectionStore.getState().setModeratorBySource((previous) => ({
      ...previous,
      sourceA: true,
    }));

    const state = useConnectionStore.getState();
    expect(state.statusBySource.sourceA).toBe("connected");
    expect(state.moderatorBySource.sourceA).toBe(true);
  });

  it("updates health map and resets all connection state", () => {
    useConnectionStore.getState().setConnectionHealthBySource((previous) => ({
      ...previous,
      sourceA: {
        lastStatus: "error",
        lastStatusAt: 123,
        lastError: "boom",
      },
    }));

    expect(
      useConnectionStore.getState().connectionHealthBySource.sourceA?.lastError,
    ).toBe("boom");

    useConnectionStore.getState().resetConnectionState();

    const state = useConnectionStore.getState();
    expect(state.connectionHealthBySource).toEqual({});
    expect(state.statusBySource).toEqual({});
    expect(state.moderatorBySource).toEqual({});
  });
});
