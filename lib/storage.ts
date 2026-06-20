/**
 * Durable localStorage helpers (Droplet 25.3.2.2).
 *
 * Every persisted store reads through these helpers, which JSON-parse and then
 * validate/migrate with a real runtime guard instead of a blind `as Type` cast.
 * Reads NEVER mutate storage, so they're safe inside useSyncExternalStore
 * snapshots. Recovering a key that fails validation is a separate, explicit step
 * (`recoverKey`) run from an effect: it resets ONLY that key and records a
 * user-facing notice — never a silent wipe of the whole store.
 */

export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Pure: parse a raw string and validate it. null for absent/invalid. */
export function validateRaw<T>(
  raw: string | null,
  validate: (parsed: unknown) => T | null,
): T | null {
  if (raw === null) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  return validate(parsed);
}

/** Pure: read a key and validate it. null for absent/invalid. For snapshots. */
export function readValidated<T>(
  key: string,
  validate: (parsed: unknown) => T | null,
): T | null {
  if (typeof window === "undefined") return null;
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(key);
  } catch {
    return null;
  }
  return validateRaw(raw, validate);
}

export type ParseOutcome<T> =
  | { status: "empty" }
  | { status: "ok"; value: T }
  | { status: "corrupt"; reason: string };

/**
 * Like readValidated but distinguishes "absent" from "present-but-corrupt", so
 * the recovery pass can reset + notify only on genuine corruption (an absent key
 * is a legitimately new/empty state, not a failure).
 */
export function parseStored<T>(
  key: string,
  validate: (parsed: unknown) => T | null,
): ParseOutcome<T> {
  if (typeof window === "undefined") return { status: "empty" };
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(key);
  } catch {
    return { status: "empty" };
  }
  if (raw === null) return { status: "empty" };
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { status: "corrupt", reason: "the saved text wasn't valid JSON" };
  }
  const value = validate(parsed);
  if (value === null) return { status: "corrupt", reason: "the saved data didn't match the expected format" };
  return { status: "ok", value };
}

/* ─── Corrupt-key recovery notices (separate external store) ──────────── */

export interface CorruptionNotice {
  key: string;
  label: string; // friendly name, e.g. "your learning progress"
  reason: string;
}

const notices = new Map<string, CorruptionNotice>();
const corruptionListeners = new Set<() => void>();
let corruptionVersion = 0;

function notifyCorruption() {
  corruptionVersion += 1;
  corruptionListeners.forEach((cb) => cb());
}

/**
 * Reset ONE corrupt key and record a notice for the UI. Removes only the named
 * key — never the whole store. Call from an effect (not during render).
 */
export function recoverKey(key: string, label: string, reason: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* storage unavailable — nothing more we can do */
  }
  if (!notices.has(key)) {
    notices.set(key, { key, label, reason });
    notifyCorruption();
  }
}

export function dismissCorruption(key: string): void {
  if (notices.delete(key)) notifyCorruption();
}

export function subscribeCorruption(cb: () => void): () => void {
  corruptionListeners.add(cb);
  return () => corruptionListeners.delete(cb);
}

const EMPTY_NOTICES: CorruptionNotice[] = [];
let corruptionSnap: CorruptionNotice[] = EMPTY_NOTICES;
let corruptionSnapVersion = -1;

export function getCorruptionSnapshot(): CorruptionNotice[] {
  if (corruptionSnapVersion !== corruptionVersion) {
    corruptionSnapVersion = corruptionVersion;
    corruptionSnap = notices.size ? [...notices.values()] : EMPTY_NOTICES;
  }
  return corruptionSnap;
}

export function getCorruptionServerSnapshot(): CorruptionNotice[] {
  return EMPTY_NOTICES;
}
