"use client";
import { useSyncExternalStore } from "react";
export const THEME_STORAGE_KEY = "quiet-chess:theme:v1";
const modes = ["system", "light", "dark"] as const;
type Theme = (typeof modes)[number];
function snapshot(): Theme {
  const value = document.documentElement.dataset.theme;
  return value === "light" || value === "dark" ? value : "system";
}
function updateBrowserColor() {
  const mode = snapshot();
  const dark =
    mode === "dark" ||
    (mode === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document
    .querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
    .forEach((meta) => {
      meta.content = dark ? "#101d17" : "#f7f8f3";
    });
}
function subscribe(listener: () => void) {
  const media = matchMedia("(prefers-color-scheme: dark)");
  const changed = () => {
    updateBrowserColor();
    listener();
  };
  const storage = (event: StorageEvent) => {
    if (event.key !== THEME_STORAGE_KEY) return;
    document.documentElement.dataset.theme = modes.includes(
      event.newValue as Theme,
    )
      ? event.newValue!
      : "system";
    changed();
  };
  window.addEventListener("quiet-chess-theme", changed);
  window.addEventListener("storage", storage);
  media.addEventListener("change", changed);
  updateBrowserColor();
  return () => {
    window.removeEventListener("quiet-chess-theme", changed);
    window.removeEventListener("storage", storage);
    media.removeEventListener("change", changed);
  };
}
export function ThemeControl() {
  const mode = useSyncExternalStore<Theme>(subscribe, snapshot, () => "system");
  const next = modes[(modes.indexOf(mode) + 1) % modes.length]!;
  return (
    <button
      type="button"
      className="theme-control"
      aria-label={`Color theme: ${mode}. Switch to ${next}.`}
      title={`Theme: ${mode}. Activate for ${next}.`}
      onClick={() => {
        document.documentElement.dataset.theme = next;
        try {
          localStorage.setItem(THEME_STORAGE_KEY, next);
        } catch {
          /* The selected theme still works for this page. */
        }
        window.dispatchEvent(new Event("quiet-chess-theme"));
      }}
    >
      <span aria-hidden="true">◐</span>
      <span className="theme-name">
        {mode[0]!.toUpperCase() + mode.slice(1)}
      </span>
    </button>
  );
}
