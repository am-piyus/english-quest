/**
 * Shareable-session link engine (Droplet 25.3.3.2).
 *
 * A session travels entirely inside the URL — there is no backend to look it up
 * from (ARCHITECTURE §2, §6.2). `encode` compresses a Lesson to a URL-safe code;
 * `decode` reverses it and runs it through the single validity gate
 * (`validateLesson`) before anyone trusts it. The link is built from the Next
 * base path, never a hardcoded origin.
 */

import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from "lz-string";
import type { Lesson } from "@/types/lesson";
import { validateLesson } from "@/lib/contentParser";

// Defensive ceiling on a decoded payload — a corrupt/oversized link should fail
// cleanly rather than try to parse megabytes of JSON.
const MAX_DECODED_CHARS = 100_000;

/** Compress a lesson into a URL-safe code for a shareable link. */
export function encode(lesson: Lesson): string {
  return compressToEncodedURIComponent(JSON.stringify(lesson));
}

/**
 * Decode a share code back into a VALIDATED Lesson. Never trusts the payload:
 * throws a clear, catchable error on empty / corrupt / oversized / invalid input
 * instead of returning a malformed lesson or crashing the player.
 */
export function decode(code: string): Lesson {
  if (!code || code.trim() === "") {
    throw new Error("This share link is empty.");
  }

  let json: string | null = null;
  try {
    json = decompressFromEncodedURIComponent(code);
  } catch {
    json = null;
  }
  if (!json) {
    throw new Error("This share link is corrupt or incomplete.");
  }
  if (json.length > MAX_DECODED_CHARS) {
    throw new Error("This shared session is too large to open.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error("This share link doesn't contain a valid session.");
  }

  const problems = validateLesson(parsed);
  if (problems.length > 0) {
    throw new Error(`This shared session is invalid: ${problems[0]}`);
  }
  return parsed as Lesson;
}

/**
 * The full shareable URL for a code: `<origin><basePath>/play#s=<code>`. The base
 * path comes from the Next config (NEXT_PUBLIC_BASE_PATH), so links work under
 * the GitHub Pages sub-path without hardcoding any origin. Client-only (uses
 * window for the origin); returns a base-path-relative URL during SSR.
 */
export function shareUrl(code: string): string {
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}${base}/play#s=${code}`;
}
