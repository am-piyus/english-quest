/**
 * Lightweight client-side user profile store.
 *
 * V0.1 deliberately avoids a database (challenging the Droplet's `lib/database.ts`
 * plan — see README "Deferred to V0.2"). Profiles live in localStorage, keyed by
 * the authenticated user's email. This is enough to validate the learning
 * experience; swapping in a real DB later only means reimplementing these
 * functions server-side.
 *
 * The store also exposes a `subscribe` + cached `snapshot` pair so React can read
 * it via `useSyncExternalStore` (see lib/useProfile.ts) without setState-in-effect.
 */

export type LearningLevel = "Beginner" | "Intermediate" | "Advanced";
export type LearningGoal = "Speaking" | "Grammar" | "Writing" | "Mixed Learning";
export type DailyTarget = 10 | 20 | 30 | 45;

export interface UserProfile {
  fullName: string;
  level: LearningLevel;
  goal: LearningGoal;
  dailyTargetMinutes: DailyTarget;
  createdAt: string;
}

const keyFor = (email: string) => `eq:profile:${email.toLowerCase()}`;

export function getProfile(email: string): UserProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(keyFor(email));
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch {
    return null;
  }
}

export function saveProfile(email: string, profile: UserProfile): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(keyFor(email), JSON.stringify(profile));
  notify();
}

export function clearProfile(email: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(keyFor(email));
  notify();
}

/* ─── External store for React (useSyncExternalStore) ─────────────────── */

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((cb) => cb());
}

export function subscribeProfile(cb: () => void): () => void {
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
// underlying localStorage string is unchanged (avoids infinite re-renders).
let snapEmail: string | null = null;
let snapRaw: string | null = null;
let snapValue: UserProfile | null = null;

export function getProfileSnapshot(email: string): UserProfile | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(keyFor(email));
  if (email === snapEmail && raw === snapRaw) return snapValue;
  snapEmail = email;
  snapRaw = raw;
  try {
    snapValue = raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch {
    snapValue = null;
  }
  return snapValue;
}
