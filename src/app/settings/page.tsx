"use client";

import { useEffect, useState } from "react";
import { Check, Moon, Sun, Monitor } from "lucide-react";
import {
  getSettings,
  saveSettings,
  type AppSettings,
  type Theme,
} from "@/lib/storage";
import { applyTheme } from "@/lib/theme";
import type { ResponseStyle } from "@/lib/ai-config";

const themeOptions: { value: Theme; label: string; Icon: typeof Sun }[] = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "system", label: "System", Icon: Monitor },
];

const styleOptions: { value: ResponseStyle; label: string; description: string }[] = [
  {
    value: "concise",
    label: "Concise",
    description: "Short, to-the-point answers -- a few sentences or a quick list.",
  },
  {
    value: "detailed",
    label: "Detailed",
    description: "Thorough explanations with examples and background context.",
  },
];

export default function SettingsPage() {
  // null until after mount, to avoid a server/client mismatch: the
  // server has no access to localStorage, so we render nothing for these
  // controls until we know the real, persisted values.
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    setSettings(getSettings());
  }, []);

  function update(partial: Partial<AppSettings>) {
    const next = saveSettings(partial);
    setSettings(next);
    if (partial.theme) {
      applyTheme(partial.theme);
    }
    setSavedFlash(true);
    const timeout = setTimeout(() => setSavedFlash(false), 1500);
    return () => clearTimeout(timeout);
  }

  if (!settings) {
    return <div className="text-sm" style={{ color: "var(--muted)" }}>Loading preferences…</div>;
  }

  return (
    <div className="space-y-10 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
          Preferences are saved to this browser and take effect immediately.
        </p>
      </div>

      <fieldset>
        <legend className="text-sm font-semibold mb-3">Appearance</legend>
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Theme">
          {themeOptions.map(({ value, label, Icon }) => {
            const selected = settings.theme === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => update({ theme: value })}
                className="flex flex-col items-center gap-2 rounded-lg border px-3 py-4 text-sm transition-colors"
                style={{
                  borderColor: selected ? "var(--accent)" : "var(--border)",
                  background: selected ? "color-mix(in srgb, var(--accent) 10%, var(--surface))" : "var(--surface)",
                }}
              >
                <Icon size={20} aria-hidden="true" />
                {label}
                {selected && <Check size={14} aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-semibold mb-3">Chat response style</legend>
        <div className="space-y-2" role="radiogroup" aria-label="Response style">
          {styleOptions.map(({ value, label, description }) => {
            const selected = settings.responseStyle === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => update({ responseStyle: value })}
                className="w-full text-left rounded-lg border px-4 py-3 transition-colors"
                style={{
                  borderColor: selected ? "var(--accent)" : "var(--border)",
                  background: selected ? "color-mix(in srgb, var(--accent) 10%, var(--surface))" : "var(--surface)",
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{label}</span>
                  {selected && <Check size={16} aria-hidden="true" />}
                </div>
                <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                  {description}
                </p>
              </button>
            );
          })}
        </div>
        <p className="text-xs mt-2" style={{ color: "var(--muted)" }}>
          This actually changes how the AI responds in Chat -- it&apos;s sent
          with every request, not just a cosmetic label.
        </p>
      </fieldset>

      <div aria-live="polite" className="text-sm" style={{ color: "var(--accent)" }}>
        {savedFlash && "Saved"}
      </div>
    </div>
  );
}
