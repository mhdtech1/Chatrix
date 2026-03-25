import { beforeEach, describe, expect, it } from "vitest";
import {
  DEFAULT_SEND_TARGET_ID,
  useChatWorkspaceStore,
} from "../../../src/renderer/store/chatWorkspaceStore";

describe("useChatWorkspaceStore", () => {
  beforeEach(() => {
    useChatWorkspaceStore.getState().resetWorkspaceState();
  });

  it("supports direct and functional updates across workspace state", () => {
    useChatWorkspaceStore.getState().setSendTargetId("source-a");
    useChatWorkspaceStore.getState().setComposerHistory(["/ban user"]);
    useChatWorkspaceStore.getState().setTabUnreadCounts((previous) => ({
      ...previous,
      tabA: 3,
    }));

    const state = useChatWorkspaceStore.getState();
    expect(state.sendTargetId).toBe("source-a");
    expect(state.composerHistory).toEqual(["/ban user"]);
    expect(state.tabUnreadCounts.tabA).toBe(3);
  });

  it("resets workspace state back to defaults", () => {
    useChatWorkspaceStore.getState().setDeckComposerByTabId({ tabA: "hello" });
    useChatWorkspaceStore.getState().setTabMentionCounts({ tabA: 1 });
    useChatWorkspaceStore.getState().setSendTargetId("source-a");

    useChatWorkspaceStore.getState().resetWorkspaceState();
    const state = useChatWorkspaceStore.getState();

    expect(state.deckComposerByTabId).toEqual({});
    expect(state.tabMentionCounts).toEqual({});
    expect(state.sendTargetId).toBe(DEFAULT_SEND_TARGET_ID);
    expect(state.composerHistory).toEqual([]);
  });
});
