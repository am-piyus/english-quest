/**
 * Theme store (Droplet 25.3.2.3) — light/dark for a static-export app.
 *
 * The chosen theme persists in localStorage; first-time visitors follow their
 * OS preference. A blocking inline script in app/layout.tsx applies the class
 * before paint (no flash); this store keeps React in sync via the
 * useSyncExternalStore contract (see lib/useTheme.ts), mirroring lib/session.ts.
 */

export type Theme = "light" | "dark";

const KEY = "eq:theme";
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((cb) => cb());
}

function systemTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function storedTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(KEY);
    return v === "light" || v === "dark" ? v : null;
  } catch {
    return null;
  }
}

/** The active theme: an explicit saved choice, else the OS preference. */
export function resolvedTheme(): Theme {
  return storedTheme() ?? systemTheme();
}

function applyToDom(theme: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export function setTheme(theme: Theme): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, theme);
  } catch {
    /* storage unavailable (private mode) — still apply for this session. */
  }
  applyToDom(theme);
  notify();
}

export function toggleTheme(): void {
  setTheme(resolvedTheme() === "dark" ? "light" : "dark");
}

/* ─── External store for React (useSyncExternalStore) ─────────────────── */

export function subscribeTheme(cb: () => void): () => void {
  listeners.add(cb);
  // Another tab changing the theme writes localStorage → "storage" fires here.
  // Re-apply the class in THIS tab so the page colours follow, then re-render.
  const onStorage = (e: StorageEvent) => {
    if (e.key !== null && e.key !== KEY) return;
    applyToDom(resolvedTheme());
    cb();
  };
  if (typeof window !== "undefined") window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", onStorage);
    }
  };
}

// Theme is a primitive, so returning a fresh read each call is referentially
// stable for useSyncExternalStore (no caching needed).
export function getThemeSnapshot(): Theme {
  return resolvedTheme();
}

export function getServerThemeSnapshot(): Theme {
  return "light";
}
