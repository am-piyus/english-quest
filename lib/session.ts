/**
 * Client-side authentication session (V0.1, static-export friendly).
 *
 * GitHub Pages can't run a server, so there's no server-side auth. The signed-in
 * user is kept in localStorage and exposed to React via `useSyncExternalStore`
 * (see lib/useSession.ts). This is intentionally lightweight — real, server-
 * verified auth is a V0.2 item for when the app moves to a backend host.
 */

import { isRecord, readValidated, validateRaw } from "@/lib/storage";

export type AuthProvider = "demo" | "google";

export interface Session {
  email: string;
  name: string;
  picture?: string;
  provider: AuthProvider;
}

export const SESSION_KEY = "eq:session";
const KEY = SESSION_KEY;

/** Runtime shape guard — replaces the old blind `as Session` cast. */
export function validateSession(raw: unknown): Session | null {
  if (!isRecord(raw)) return null;
  if (typeof raw.email !== "string" || raw.email === "") return null;
  if (typeof raw.name !== "string") return null;
  if (raw.provider !== "demo" && raw.provider !== "google") return null;
  return {
    email: raw.email,
    name: raw.name,
    picture: typeof raw.picture === "string" ? raw.picture : undefined,
    provider: raw.provider,
  };
}

export function getSession(): Session | null {
  return readValidated(KEY, validateSession);
}

export function saveSession(session: Session): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(session));
  } catch {
    // Storage full or blocked (private mode) — don't throw; let the flow proceed.
  }
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
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    return null; // storage access blocked — degrade instead of throwing in render
  }
  if (snapInit && raw === snapRaw) return snapValue;
  snapInit = true;
  snapRaw = raw;
  snapValue = validateRaw(raw, validateSession);
  return snapValue;
}
