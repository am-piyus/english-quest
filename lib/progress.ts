/**
 * Learning progress store (client-side, localStorage).
 *
 * Holds one SessionResult per completed day, keyed by the user's email. The
 * dashboard reads derived stats and the calendar from here; Droplet 25.3.1.7
 * writes results when a session is completed. Like the rest of V0.1 this is
 * browser-local — a real database is a V0.2 concern.
 */

import { getAllLessonMeta, totalLessons, type LessonMeta } from "@/lib/lessons";
import {
  isRecord,
  parseStored,
  readValidated,
  recoverKey,
  validateRaw,
} from "@/lib/storage";

/** Bump when the persisted shape changes; migrateSessionResult upgrades older data. */
export const RESULT_VERSION = 1;

export interface SessionResult {
  _v: number;
  day: number;
  completedAt: string; // ISO timestamp
  stars: number;
  accuracy: number; // 0–100
  durationSec: number;
  correct: number;
  total: number;
}

export type ProgressMap = Record<number, SessionResult>;

const EMPTY: ProgressMap = {};
export const progressKeyFor = (email: string) =>
  `eq:progress:${email.toLowerCase()}`;
const keyFor = progressKeyFor;

const num = (x: unknown): number | null =>
  typeof x === "number" && Number.isFinite(x) ? x : null;
const nonneg = (x: unknown): number | null => {
  const n = num(x);
  return n !== null && n >= 0 ? n : null;
};
const clamp = (n: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, n));

/** Validate + upgrade one stored SessionResult, or null if unrecoverable. */
function migrateSessionResult(raw: unknown): SessionResult | null {
  if (!isRecord(raw)) return null;
  const day = num(raw.day);
  const stars = nonneg(raw.stars);
  if (day === null || day < 1 || stars === null) return null; // minimum viable
  return {
    _v: RESULT_VERSION,
    day,
    completedAt:
      typeof raw.completedAt === "string"
        ? raw.completedAt
        : new Date(0).toISOString(),
    stars,
    accuracy: clamp(num(raw.accuracy) ?? 0, 0, 100),
    durationSec: nonneg(raw.durationSec) ?? 0,
    correct: nonneg(raw.correct) ?? 0,
    total: nonneg(raw.total) ?? 0,
  };
}

/**
 * Validate the whole ProgressMap: keep every entry that survives validation,
 * silently drop individual unrecoverable records (don't nuke the streak over one
 * bad day). A non-object container — or one whose every entry is garbage — is
 * reported as corrupt (null) so the recovery pass resets just this key.
 */
export function migrateProgressMap(raw: unknown): ProgressMap | null {
  if (!isRecord(raw)) return null;
  const entries = Object.entries(raw);
  const out: ProgressMap = {};
  let kept = 0;
  for (const [k, v] of entries) {
    const day = Number(k);
    // Only accept a canonical positive-integer key ("3", not "1e3"/"007"/" 3 ").
    if (!Number.isInteger(day) || String(day) !== k || day < 1) continue;
    const result = migrateSessionResult(v);
    if (result) {
      out[day] = { ...result, day }; // the map key is authoritative
      kept += 1;
    }
  }
  if (entries.length > 0 && kept === 0) return null; // had data, all unreadable
  return out;
}

export function getProgress(email: string): ProgressMap {
  return readValidated(keyFor(email), migrateProgressMap) ?? EMPTY;
}

export function saveResult(email: string, result: SessionResult): void {
  if (typeof window === "undefined") return;
  // Read the existing blob defensively: if it's corrupt, recover (reset + notify)
  // before writing, so a fresh write can't silently paper over the corruption.
  const current = parseStored(keyFor(email), migrateProgressMap);
  if (current.status === "corrupt") {
    recoverKey(keyFor(email), "your learning progress", current.reason);
  }
  const map = current.status === "ok" ? current.value : EMPTY;
  const stamped: SessionResult = { ...result, _v: RESULT_VERSION };
  // Keep the best result for a day (don't let a retry lower the score).
  const existing = map[stamped.day];
  const next: ProgressMap = {
    ...map,
    [stamped.day]:
      existing && existing.stars >= stamped.stars ? existing : stamped,
  };
  try {
    window.localStorage.setItem(keyFor(email), JSON.stringify(next));
  } catch {
    // Storage full or blocked (e.g. private mode) — don't throw, so the session
    // can still finish and navigate; the result just isn't persisted.
  }
  notify();
}

export function clearProgress(email: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(keyFor(email));
  notify();
}

/* ─── Derived stats ───────────────────────────────────────────────────── */

export interface ProgressStats {
  completedCount: number;
  totalStars: number;
  currentStreak: number;
  completionPercent: number;
}

function dateKeyUTC(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function computeStreak(results: SessionResult[]): number {
  if (results.length === 0) return 0;
  const days = new Set(results.map((r) => r.completedAt.slice(0, 10)));
  const cursor = new Date();
  // Anchor to today, or yesterday if today's lesson isn't done yet.
  if (!days.has(dateKeyUTC(cursor))) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  let streak = 0;
  while (days.has(dateKeyUTC(cursor))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

export function deriveStats(map: ProgressMap): ProgressStats {
  const results = Object.values(map);
  const completedCount = results.length;
  const totalStars = results.reduce((sum, r) => sum + r.stars, 0);
  const completionPercent = Math.round(
    (completedCount / Math.max(1, totalLessons())) * 100,
  );
  return {
    completedCount,
    totalStars,
    currentStreak: computeStreak(results),
    completionPercent,
  };
}

/* ─── Calendar / journey ──────────────────────────────────────────────── */

export type DayStatus = "completed" | "current" | "locked";

export interface CalendarDay {
  meta: LessonMeta;
  status: DayStatus;
  result?: SessionResult;
}

/**
 * A day unlocks when the previous day is completed. The first unlocked,
 * not-yet-completed day is the "current" mission; everything past it is locked.
 */
export function buildCalendar(map: ProgressMap): CalendarDay[] {
  let currentAssigned = false;
  return getAllLessonMeta().map((meta) => {
    const result = map[meta.day];
    if (result) return { meta, status: "completed", result };

    const unlocked = meta.day === 1 || Boolean(map[meta.day - 1]);
    if (unlocked && !currentAssigned) {
      currentAssigned = true;
      return { meta, status: "current" };
    }
    return { meta, status: "locked" };
  });
}

export function currentDay(map: ProgressMap): number | null {
  return buildCalendar(map).find((d) => d.status === "current")?.meta.day ?? null;
}

/* ─── External store for React (useSyncExternalStore) ─────────────────── */

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((cb) => cb());
}

export function subscribeProgress(cb: () => void): () => void {
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

let snapEmail: string | null = null;
let snapRaw: string | null = null;
let snapValue: ProgressMap = EMPTY;

export function getProgressSnapshot(email: string): ProgressMap {
  if (typeof window === "undefined") return EMPTY;
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(keyFor(email));
  } catch {
    return EMPTY;
  }
  if (email === snapEmail && raw === snapRaw) return snapValue;
  snapEmail = email;
  snapRaw = raw;
  snapValue = validateRaw(raw, migrateProgressMap) ?? EMPTY;
  return snapValue;
}
