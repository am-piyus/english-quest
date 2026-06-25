/**
 * Learning progress store (client-side, localStorage).
 *
 * Holds one SessionResult per completed day, keyed by the user's email. The
 * dashboard reads derived stats and the calendar from here; Droplet 25.3.1.7
 * writes results when a session is completed. Like the rest of V0.1 this is
 * browser-local — a real database is a V0.2 concern.
 */

import { getAllLessonMeta, totalLessons, type LessonMeta } from "@/lib/lessons";
import type { AnswerResult } from "@/types/question";
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

/* ─── Session-keyed result log (Droplet 25.3.3.7) ──────────────────────────
   Every completed session — registry, shared, or local — is recorded here keyed
   by its session id, so custom/shared sessions log just like registry ones and
   a future dashboard has structured, JSON-serialisable data to read. The
   day-keyed ProgressMap above stays the source for the registry calendar. */

export const LOGGED_RESULT_VERSION = 1;

export interface LoggedResult {
  _v: number;
  sessionId: string;
  source: "registry" | "shared" | "local";
  day: number; // the lesson's own day (0 for builder-made sessions)
  title: string;
  completedAt: string; // ISO
  stars: number;
  accuracy: number; // 0–100
  durationSec: number;
  correct: number;
  total: number;
  responses: AnswerResult[]; // per-question results
}

type ResultLog = Record<string, LoggedResult>;
const resultsKeyFor = (email: string) => `eq:results:${email.toLowerCase()}`;

function migrateResultLog(raw: unknown): ResultLog | null {
  if (!isRecord(raw)) return null;
  const out: ResultLog = {};
  for (const [id, v] of Object.entries(raw)) {
    if (isRecord(v) && typeof v.sessionId === "string") {
      out[id] = v as unknown as LoggedResult;
    }
  }
  return out;
}

export function logSessionResult(email: string, record: LoggedResult): void {
  if (typeof window === "undefined") return;
  const key = resultsKeyFor(email);
  const current = parseStored(key, migrateResultLog);
  if (current.status === "corrupt") {
    recoverKey(key, "your session results", current.reason);
  }
  const log: ResultLog = current.status === "ok" ? { ...current.value } : {};
  const stamped: LoggedResult = { ...record, _v: LOGGED_RESULT_VERSION };
  // Keep the best attempt per session (a replay shouldn't lower the score).
  const existing = log[stamped.sessionId];
  log[stamped.sessionId] =
    existing && existing.stars >= stamped.stars ? existing : stamped;
  try {
    window.localStorage.setItem(key, JSON.stringify(log));
  } catch {
    /* storage blocked — finishing the session still proceeds */
  }
  notify();
}

export function getLoggedResults(email: string): ResultLog {
  return readValidated(resultsKeyFor(email), migrateResultLog) ?? {};
}

export function getLoggedResult(
  email: string,
  sessionId: string,
): LoggedResult | null {
  return getLoggedResults(email)[sessionId] ?? null;
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
