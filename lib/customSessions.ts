/**
 * Session source resolver (Droplet 25.3.3.3) + per-user authored-session store
 * (Droplet 25.3.3.8).
 *
 * One place that turns "where did this session come from" into a validated
 * Lesson, so the player (`SessionScreen`) never has to care. Every source runs
 * through `validateLesson` (registry validates on import, shared via
 * shareLink.decode, local on read here) — the single validity gate.
 *
 * Locally-authored sessions are namespaced by the signed-in user's email
 * (`eq:local:<email>:<id>`, index at `eq:local-index:<email>`) so a future
 * dashboard can fetch a particular user's created sessions, and each carries
 * authorship metadata (author, createdAt, updatedAt). Sessions saved under the
 * pre-25.3.3.8 global keys are migrated once, losslessly, to the first user who
 * signs in afterwards (see `migrateLegacyLocalSessions`). The authorship lives
 * in this device-local index sidecar, never in the Lesson payload — so
 * `validateLesson` stays untouched and shared links never leak the author.
 */

import type { Lesson } from "@/types/lesson";
import { getLesson } from "@/lib/lessonContent";
import { decode } from "@/lib/shareLink";
import { validateLesson } from "@/lib/contentParser";
import { isRecord } from "@/lib/storage";

export type SessionSource =
  | { kind: "registry"; day: number }
  | { kind: "shared"; code: string }
  | { kind: "local"; id: string };

export interface LocalSessionMeta {
  id: string;
  title: string;
  author: string; // owner email (lowercased)
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

const EPOCH = "1970-01-01T00:00:00.000Z";

// Per-user keys (Droplet 25.3.3.8).
const localPrefix = (email: string) => `eq:local:${email.toLowerCase()}:`;
const localIndexKey = (email: string) =>
  `eq:local-index:${email.toLowerCase()}`;

// Pre-25.3.3.8 global keys, kept only so the one-time migration can adopt them.
const LEGACY_PREFIX = "eq:local:";
const LEGACY_INDEX = "eq:local-index";

function nowIso(): string {
  return new Date().toISOString();
}

/**
 * Resolve any session source to a validated Lesson, or null on failure. A
 * `local` source needs the signed-in user's email (its store is per-user); a
 * missing email simply yields null (nobody to look it up for).
 */
export function loadSession(
  source: SessionSource,
  email?: string,
): Lesson | null {
  switch (source.kind) {
    case "registry":
      return getLesson(source.day);
    case "shared":
      try {
        return decode(source.code);
      } catch {
        return null; // the caller surfaces a clear, source-appropriate message
      }
    case "local":
      return email ? loadLocalSession(email, source.id) : null;
  }
}

function loadLocalSession(email: string, id: string): Lesson | null {
  if (typeof window === "undefined") return null;
  ensureMigrated(email);
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(localPrefix(email) + id);
  } catch {
    return null;
  }
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (validateLesson(parsed).length > 0) return null; // never trust stored data
    return parsed as Lesson;
  } catch {
    return null;
  }
}

function readIndex(email: string): LocalSessionMeta[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(localIndexKey(email));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const owner = email.toLowerCase();
    return parsed.filter(isRecord).flatMap((m) => {
      if (typeof m.id !== "string" || typeof m.title !== "string") return [];
      const createdAt =
        typeof m.createdAt === "string" ? m.createdAt : EPOCH;
      return [
        {
          id: m.id,
          title: m.title,
          author: typeof m.author === "string" ? m.author : owner,
          createdAt,
          updatedAt: typeof m.updatedAt === "string" ? m.updatedAt : createdAt,
        },
      ];
    });
  } catch {
    return [];
  }
}

function writeIndex(email: string, list: LocalSessionMeta[]): void {
  try {
    window.localStorage.setItem(localIndexKey(email), JSON.stringify(list));
  } catch {
    /* storage blocked (private mode) — degrade quietly */
  }
}

function newId(): string {
  return "ls_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/**
 * Persist a lesson for `email` (the builder validates before calling this) and
 * return its id. Records id/title/author/timestamps in that user's index for
 * listing and a future dashboard. Re-saving an existing id preserves its
 * `createdAt` and bumps `updatedAt` (forward-compatible with an edit flow).
 */
export function saveLocalSession(email: string, lesson: Lesson): string {
  const id = newId();
  if (typeof window === "undefined") return id;
  ensureMigrated(email);
  try {
    window.localStorage.setItem(
      localPrefix(email) + id,
      JSON.stringify(lesson),
    );
  } catch {
    return id;
  }
  const now = nowIso();
  const current = readIndex(email);
  const existing = current.find((m) => m.id === id);
  const index = current.filter((m) => m.id !== id);
  index.push({
    id,
    title: lesson.title || "Untitled session",
    author: email.toLowerCase(),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  });
  writeIndex(email, index);
  return id;
}

/** Sessions this user has authored on this device (index order). */
export function listLocalSessions(email: string): LocalSessionMeta[] {
  if (typeof window === "undefined") return [];
  ensureMigrated(email);
  return readIndex(email);
}

/**
 * Dashboard-facing accessor (Droplet 25.3.3.8): a user's authored sessions,
 * newest first. Same data as `listLocalSessions`, ordered for display.
 */
export function listAuthoredSessions(email: string): LocalSessionMeta[] {
  return listLocalSessions(email)
    .slice()
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/* ─── One-time legacy migration (Droplet 25.3.3.8) ─────────────────────────
   Sessions saved before this droplet used global keys (`eq:local:<id>` +
   `eq:local-index`) with no owner. Adopt them into the first user who signs in
   afterwards: copy each blob into that user's namespace, stamp authorship, then
   consume the legacy index so a second user on the same device doesn't re-claim
   them. Idempotent and guarded so it runs at most once per email per load. */

const migratedEmails = new Set<string>();

function ensureMigrated(email: string): void {
  const owner = email.toLowerCase();
  if (migratedEmails.has(owner)) return;
  migratedEmails.add(owner);
  try {
    migrateLegacyLocalSessions(owner);
  } catch {
    /* never let a migration hiccup block save/load */
  }
}

function migrateLegacyLocalSessions(owner: string): void {
  if (typeof window === "undefined") return;
  let legacyRaw: string | null;
  try {
    legacyRaw = window.localStorage.getItem(LEGACY_INDEX);
  } catch {
    return;
  }
  if (!legacyRaw) return; // nothing legacy to adopt
  let legacy: unknown;
  try {
    legacy = JSON.parse(legacyRaw);
  } catch {
    safeRemove(LEGACY_INDEX); // legacy index is garbage — drop it
    return;
  }
  if (!Array.isArray(legacy)) {
    safeRemove(LEGACY_INDEX);
    return;
  }

  const now = nowIso();
  const target = readIndex(owner);
  const have = new Set(target.map((m) => m.id));

  for (const entry of legacy) {
    if (!isRecord(entry) || typeof entry.id !== "string") continue;
    const id = entry.id;
    if (have.has(id)) continue; // already adopted — idempotent

    let blob: string | null;
    try {
      blob = window.localStorage.getItem(LEGACY_PREFIX + id);
    } catch {
      blob = null;
    }
    if (!blob) continue; // index referenced a missing blob — skip

    try {
      window.localStorage.setItem(localPrefix(owner) + id, blob);
    } catch {
      continue; // storage full — leave the legacy copy in place, try later
    }
    target.push({
      id,
      title: typeof entry.title === "string" ? entry.title : "Untitled session",
      author: owner,
      createdAt: now,
      updatedAt: now,
    });
    have.add(id);
    safeRemove(LEGACY_PREFIX + id); // legacy blob now adopted
  }

  writeIndex(owner, target);
  safeRemove(LEGACY_INDEX); // consumed — a later user won't re-claim these
}

function safeRemove(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* storage unavailable — nothing more we can do */
  }
}

/** FNV-1a → base36: a short, stable digest of a share code. */
function fnv1a(s: string): string {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

/** A stable per-session id for result logging (Droplet 25.3.3.7). */
export function sessionIdFor(source: SessionSource): string {
  switch (source.kind) {
    case "registry":
      return `registry:${source.day}`;
    case "local":
      return `local:${source.id}`;
    case "shared":
      return `shared:${fnv1a(source.code)}`;
  }
}
