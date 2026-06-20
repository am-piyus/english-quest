/**
 * Learning progress store (client-side, localStorage).
 *
 * Holds one SessionResult per completed day, keyed by the user's email. The
 * dashboard reads derived stats and the calendar from here; Droplet 25.3.1.7
 * writes results when a session is completed. Like the rest of V0.1 this is
 * browser-local — a real database is a V0.2 concern.
 */

import { getAllLessonMeta, totalLessons, type LessonMeta } from "@/lib/lessons";

export interface SessionResult {
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
const keyFor = (email: string) => `eq:progress:${email.toLowerCase()}`;

export function getProgress(email: string): ProgressMap {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(keyFor(email));
    return raw ? (JSON.parse(raw) as ProgressMap) : EMPTY;
  } catch {
    return EMPTY;
  }
}

export function saveResult(email: string, result: SessionResult): void {
  if (typeof window === "undefined") return;
  const map = getProgress(email);
  // Keep the best result for a day (don't let a retry lower the score).
  const existing = map[result.day];
  const next: ProgressMap = {
    ...map,
    [result.day]:
      existing && existing.stars >= result.stars ? existing : result,
  };
  window.localStorage.setItem(keyFor(email), JSON.stringify(next));
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
  const raw = window.localStorage.getItem(keyFor(email));
  if (email === snapEmail && raw === snapRaw) return snapValue;
  snapEmail = email;
  snapRaw = raw;
  try {
    snapValue = raw ? (JSON.parse(raw) as ProgressMap) : EMPTY;
  } catch {
    snapValue = EMPTY;
  }
  return snapValue;
}
