/**
 * Session source resolver (Droplet 25.3.3.3).
 *
 * One place that turns "where did this session come from" into a validated
 * Lesson, so the player (`SessionScreen`) never has to care. Every source runs
 * through `validateLesson` (registry validates on import, shared via
 * shareLink.decode, local on read here) — the single validity gate.
 */

import type { Lesson } from "@/types/lesson";
import { getLesson } from "@/lib/lessonContent";
import { decode } from "@/lib/shareLink";
import { validateLesson } from "@/lib/contentParser";

export type SessionSource =
  | { kind: "registry"; day: number }
  | { kind: "shared"; code: string }
  | { kind: "local"; id: string };

export interface LocalSessionMeta {
  id: string;
  title: string;
}

const LOCAL_PREFIX = "eq:local:";
const LOCAL_INDEX = "eq:local-index";

/** Resolve any session source to a validated Lesson, or null on failure. */
export function loadSession(source: SessionSource): Lesson | null {
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
      return loadLocalSession(source.id);
  }
}

function loadLocalSession(id: string): Lesson | null {
  if (typeof window === "undefined") return null;
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(LOCAL_PREFIX + id);
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

function readIndex(): LocalSessionMeta[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_INDEX);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (m): m is LocalSessionMeta =>
        !!m &&
        typeof (m as LocalSessionMeta).id === "string" &&
        typeof (m as LocalSessionMeta).title === "string",
    );
  } catch {
    return [];
  }
}

function writeIndex(list: LocalSessionMeta[]): void {
  try {
    window.localStorage.setItem(LOCAL_INDEX, JSON.stringify(list));
  } catch {
    /* storage blocked (private mode) — degrade quietly */
  }
}

function newId(): string {
  return "ls_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/**
 * Persist a lesson locally (the builder validates before calling this) and
 * return its id. Records the id+title in a small index for listing/reopening.
 */
export function saveLocalSession(lesson: Lesson): string {
  const id = newId();
  if (typeof window === "undefined") return id;
  try {
    window.localStorage.setItem(LOCAL_PREFIX + id, JSON.stringify(lesson));
  } catch {
    return id;
  }
  const index = readIndex().filter((m) => m.id !== id);
  index.push({ id, title: lesson.title || "Untitled session" });
  writeIndex(index);
  return id;
}

export function listLocalSessions(): LocalSessionMeta[] {
  return readIndex();
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
