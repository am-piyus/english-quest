/**
 * SpellQuest round selection (V1) — the deterministic counterpart to
 * lib/wordSearch.ts. Authors give a word list; a round is the sanitized list, or
 * a seeded subset when a smaller `count` is set. Seeding from the word list means
 * everyone opening the same shared session plays the EXACT same round, without
 * baking the selection into the link (ARCHITECTURE §6.3). No unseeded randomness.
 */

import type { SpellQuest, SpellWord } from "@/types/lesson";

// Deterministic string-seeded hash → 32-bit seed (same family as wordSearch.ts).
function xmur3(str: string): number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  h ^= h >>> 16;
  return h >>> 0;
}

// Deterministic PRNG in [0, 1).
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Letters with optional internal apostrophe/hyphen, 2–40 chars.
const WORD_RE = /^[A-Za-z]+(?:['’-][A-Za-z]+)*$/;

/** Trim, drop blanks/invalid/duplicate words, keep order. Pure. */
export function sanitizeSpellWords(words: SpellWord[] | undefined): SpellWord[] {
  const out: SpellWord[] = [];
  const seen = new Set<string>();
  for (const w of words ?? []) {
    if (!w || typeof w.word !== "string") continue;
    const word = w.word.trim();
    if (word.length < 2 || word.length > 40 || !WORD_RE.test(word)) continue;
    const k = word.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push({
      word,
      hint: typeof w.hint === "string" && w.hint.trim() ? w.hint.trim() : undefined,
      example:
        typeof w.example === "string" && w.example.trim()
          ? w.example.trim()
          : undefined,
    });
  }
  return out;
}

/**
 * The words actually played, in order. The full sanitized list, or — when a
 * smaller `count` is set — a seeded subset (seeded from the words + count, so it's
 * identical for everyone opening the same session).
 */
export function selectSpellWords(spell: SpellQuest): SpellWord[] {
  const clean = sanitizeSpellWords(spell.words);
  const cap = spell.count;
  if (!cap || !Number.isFinite(cap) || cap >= clean.length) return clean;
  const n = Math.max(1, Math.floor(cap));
  const seed = xmur3(clean.map((w) => w.word.toLowerCase()).join("|") + "#" + n);
  const rand = mulberry32(seed);
  const arr = [...clean];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1)); // seeded Fisher–Yates
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, n);
}

/** How many words the round plays — also drives the session's gradable units. */
export function spellRoundCount(spell: SpellQuest): number {
  return selectSpellWords(spell).length;
}
