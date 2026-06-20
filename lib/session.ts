/**
 * Client-side authentication session (V0.1, static-export friendly).
 *
 * GitHub Pages can't run a server, so there's no server-side auth. The signed-in
 * user is kept in localStorage and exposed to React via `useSyncExternalStore`
 * (see lib/useSession.ts). This is intentionally lightweight — real, server-
 * verified auth is a V0.2 item for when the app moves to a backend host.
 */

export type AuthProvider = "demo" | "google";

export interface Session {
  email: string;
  name: string;
  picture?: string;
  provider: AuthProvider;
}

const KEY = "eq:session";

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function saveSession(session: Session): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(session));
  notify();
}

export function signInDemo(): void {
  saveSession({
    email: "demo@englishquest.app",
    name: "Demo Learner",
    provider: "demo",
  });
}

export function signOut(): void {
  if (typeof window === "undefined") return;
  // Make Google sign-out predictable: stop GIS from silently auto-selecting the
  // same account on the next visit. Guarded — a no-op if GIS never loaded.
  try {
    window.google?.accounts?.id?.disableAutoSelect();
  } catch {
    /* GIS not present — nothing to disable. */
  }
  window.localStorage.removeItem(KEY);
  notify();
}

/* ─── External store for React (useSyncExternalStore) ─────────────────── */

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((cb) => cb());
}

export function subscribeSession(cb: () => void): () => void {
  listeners.add(cb);
  if (typeof window !== "undefined") {
    window.addEventListener("storage", cb);
  }
  return () => {
    listeners.delete(cb);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", cb);
    }
  };
}

// Cached snapshot so useSyncExternalStore gets a stable reference while the
// underlying localStorage string is unchanged.
let snapInit = false;
let snapRaw: string | null = null;
let snapValue: Session | null = null;

export function getSessionSnapshot(): Session | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(KEY);
  if (snapInit && raw === snapRaw) return snapValue;
  snapInit = true;
  snapRaw = raw;
  try {
    snapValue = raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    snapValue = null;
  }
  return snapValue;
}
