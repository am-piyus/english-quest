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

import { isRecord, readValidated, validateRaw } from "@/lib/storage";

export type LearningLevel = "Beginner" | "Intermediate" | "Advanced";
export type LearningGoal = "Speaking" | "Grammar" | "Writing" | "Mixed Learning";
export type DailyTarget = 10 | 20 | 30 | 45;

/** Bump when the persisted shape changes; migrateProfile upgrades older data. */
export const PROFILE_VERSION = 1;

export interface UserProfile {
  _v: number;
  fullName: string;
  level: LearningLevel;
  goal: LearningGoal;
  dailyTargetMinutes: DailyTarget;
  createdAt: string;
}

const LEVELS: LearningLevel[] = ["Beginner", "Intermediate", "Advanced"];
const GOALS: LearningGoal[] = ["Speaking", "Grammar", "Writing", "Mixed Learning"];
const TARGETS: DailyTarget[] = [10, 20, 30, 45];

export const profileKeyFor = (email: string) =>
  `eq:profile:${email.toLowerCase()}`;
const keyFor = profileKeyFor;

/**
 * Validate + upgrade stored profile data to the current shape, or null if it's
 * unrecoverable. Legacy V0.1 data has no `_v` (treated as v0); the field shape
 * is unchanged so far, so the upgrade is just stamping the version. Future shape
 * changes branch on the stored `_v` here.
 */
export function migrateProfile(raw: unknown): UserProfile | null {
  if (!isRecord(raw)) return null;
  const fullName = typeof raw.fullName === "string" ? raw.fullName.trim() : "";
  if (fullName === "") return null;
  if (!LEVELS.includes(raw.level as LearningLevel)) return null;
  if (!GOALS.includes(raw.goal as LearningGoal)) return null;
  if (!TARGETS.includes(raw.dailyTargetMinutes as DailyTarget)) return null;
  const createdAt =
    typeof raw.createdAt === "string" ? raw.createdAt : new Date(0).toISOString();
  return {
    _v: PROFILE_VERSION,
    fullName,
    level: raw.level as LearningLevel,
    goal: raw.goal as LearningGoal,
    dailyTargetMinutes: raw.dailyTargetMinutes as DailyTarget,
    createdAt,
  };
}

export function getProfile(email: string): UserProfile | null {
  return readValidated(keyFor(email), migrateProfile);
}

export function saveProfile(
  email: string,
  profile: Omit<UserProfile, "_v">,
): void {
  if (typeof window === "undefined") return;
  const toStore: UserProfile = { ...profile, _v: PROFILE_VERSION };
  try {
    window.localStorage.setItem(keyFor(email), JSON.stringify(toStore));
  } catch {
    // Storage full or blocked (private mode) — don't throw; let the flow proceed.
  }
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
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(keyFor(email));
  } catch {
    return null;
  }
  if (email === snapEmail && raw === snapRaw) return snapValue;
  snapEmail = email;
  snapRaw = raw;
  snapValue = validateRaw(raw, migrateProfile);
  return snapValue;
}
