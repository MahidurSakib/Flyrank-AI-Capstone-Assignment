import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_SETTINGS,
  deleteSession,
  getSession,
  getSettings,
  listSessions,
  saveSettings,
  upsertSession,
  type StoredMessage,
} from "../storage";

beforeEach(() => {
  window.localStorage.clear();
});

describe("settings", () => {
  it("returns defaults when nothing has been saved", () => {
    expect(getSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it("persists a partial update, merging with existing settings", () => {
    saveSettings({ theme: "dark" });
    expect(getSettings()).toEqual({ ...DEFAULT_SETTINGS, theme: "dark" });

    saveSettings({ responseStyle: "detailed" });
    expect(getSettings()).toEqual({ theme: "dark", responseStyle: "detailed" });
  });

  it("falls back to defaults if the stored value is corrupted JSON", () => {
    window.localStorage.setItem("ai-study-assistant:settings", "{not valid json");
    expect(getSettings()).toEqual(DEFAULT_SETTINGS);
  });
});

describe("chat sessions", () => {
  const messages: StoredMessage[] = [
    { id: "m1", role: "user", text: "How does photosynthesis work?" },
    { id: "m2", role: "assistant", text: "Plants convert light into energy..." },
  ];

  it("creates a new session on first upsert, deriving a title from the first user message", () => {
    upsertSession("session-1", messages);
    const session = getSession("session-1");

    expect(session).toBeDefined();
    expect(session!.title).toBe("How does photosynthesis work?");
    expect(session!.messages).toHaveLength(2);
    expect(session!.createdAt).toBe(session!.updatedAt);
  });

  it("truncates very long first messages for the title", () => {
    const longText = "a".repeat(100);
    upsertSession("session-2", [{ id: "m1", role: "user", text: longText }]);
    const session = getSession("session-2");

    expect(session!.title.length).toBeLessThanOrEqual(61); // 60 chars + ellipsis
    expect(session!.title.endsWith("…")).toBe(true);
  });

  it("updates an existing session in place, preserving createdAt", () => {
    upsertSession("session-3", [messages[0]]);
    const first = getSession("session-3")!;

    // Simulate a later update with an additional message.
    upsertSession("session-3", messages);
    const updated = getSession("session-3")!;

    expect(updated.createdAt).toBe(first.createdAt);
    expect(updated.messages).toHaveLength(2);
  });

  it("does nothing when upserting an empty message list", () => {
    upsertSession("session-4", []);
    expect(getSession("session-4")).toBeUndefined();
  });

  it("lists sessions most-recently-updated first", () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
      upsertSession("older", messages);

      vi.setSystemTime(new Date("2026-01-01T00:05:00.000Z"));
      upsertSession("newer", messages);

      const [first, second] = listSessions();
      expect(first.id).toBe("newer");
      expect(second.id).toBe("older");
    } finally {
      vi.useRealTimers();
    }
  });

  it("deletes a session", () => {
    upsertSession("to-delete", messages);
    expect(getSession("to-delete")).toBeDefined();

    deleteSession("to-delete");
    expect(getSession("to-delete")).toBeUndefined();
  });

  it("falls back gracefully if the stored sessions value is corrupted", () => {
    window.localStorage.setItem("ai-study-assistant:sessions", "not an array");
    expect(listSessions()).toEqual([]);
  });
});
