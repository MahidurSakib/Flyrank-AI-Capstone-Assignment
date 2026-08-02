import type { ResponseStyle } from "./ai-config";

/**
 * storage.ts
 * -----------------------------------------------------------------------
 * Client-side persistence for two things:
 * 1. App settings (theme, response style) -- read by Settings page and
 *    Chat page, written only by Settings page.
 * 2. Chat session history -- read/written by Chat page, listed/deleted by
 *    History page.
 *
 * Deliberately uses localStorage rather than a database: this is a
 * portfolio-scale, single-user app, and the README documents this as a
 * known limitation (no cross-device sync) rather than hiding the
 * trade-off. All functions guard against a missing `window` so they're
 * safe to import (though not to call with meaningful effect) from
 * server-rendered code, and so they're safely unit-testable under jsdom.
 * -----------------------------------------------------------------------
 */

const SETTINGS_KEY = "ai-study-assistant:settings";
const SESSIONS_KEY = "ai-study-assistant:sessions";

export type Theme = "light" | "dark" | "system";

export interface AppSettings {
  theme: Theme;
  responseStyle: ResponseStyle;
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: "system",
  responseStyle: "concise",
};

function hasWindow(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getSettings(): AppSettings {
  if (!hasWindow()) return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(update: Partial<AppSettings>): AppSettings {
  const next = { ...getSettings(), ...update };
  if (hasWindow()) {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  }
  return next;
}

export interface StoredMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
}

export interface ChatSessionRecord {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: StoredMessage[];
}

function readAllSessions(): ChatSessionRecord[] {
  if (!hasWindow()) return [];
  try {
    const raw = window.localStorage.getItem(SESSIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAllSessions(sessions: ChatSessionRecord[]): void {
  if (!hasWindow()) return;
  window.localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

/** Sessions most-recently-updated first. */
export function listSessions(): ChatSessionRecord[] {
  return [...readAllSessions()].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export function getSession(id: string): ChatSessionRecord | undefined {
  return readAllSessions().find((s) => s.id === id);
}

/** A short, human title derived from the first user message. */
function deriveTitle(messages: StoredMessage[]): string {
  const firstUserMessage = messages.find((m) => m.role === "user");
  if (!firstUserMessage) return "New conversation";
  const trimmed = firstUserMessage.text.trim();
  return trimmed.length > 60 ? `${trimmed.slice(0, 60)}…` : trimmed || "New conversation";
}

/**
 * Creates or updates a session's message list. Called on every message
 * change from the Chat page. `createdAt` is preserved across updates;
 * `updatedAt` always reflects the latest write.
 */
export function upsertSession(id: string, messages: StoredMessage[]): void {
  if (messages.length === 0) return;
  const all = readAllSessions();
  const existingIndex = all.findIndex((s) => s.id === id);
  const now = new Date().toISOString();

  const record: ChatSessionRecord = {
    id,
    title: deriveTitle(messages),
    createdAt: existingIndex >= 0 ? all[existingIndex].createdAt : now,
    updatedAt: now,
    messages,
  };

  if (existingIndex >= 0) {
    all[existingIndex] = record;
  } else {
    all.push(record);
  }
  writeAllSessions(all);
}

export function deleteSession(id: string): void {
  writeAllSessions(readAllSessions().filter((s) => s.id !== id));
}
