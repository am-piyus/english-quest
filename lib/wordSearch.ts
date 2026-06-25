/**
 * Deterministic word-search generator (Droplet 25.3.3.6).
 *
 * The grid is seeded ENTIRELY from the word list + size — no unseeded
 * Math.random() — so two friends opening the same shared session get the exact
 * same puzzle without baking the grid into the link (keeps links small,
 * ARCHITECTURE §6.3). Returns the filled grid plus each placed word's cells so
 * the UI can match a selection precisely.
 */

export interface PlacedWord {
  word: string; // sanitized, uppercase
  cells: { r: number; c: number }[];
}

export interface WordSearchGrid {
  size: number;
  grid: string[][]; // size×size uppercase letters
  placed: PlacedWord[]; // the words that were successfully placed
}

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// Placement directions: E, S, SE, NE (horizontal, vertical, both diagonals).
const DIRECTIONS = [
  { dr: 0, dc: 1 },
  { dr: 1, dc: 0 },
  { dr: 1, dc: 1 },
  { dr: -1, dc: 1 },
];

/** Deterministic string-seeded hash → 32-bit seed. */
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

/** Deterministic PRNG in [0, 1). */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function sanitizeWord(word: string): string {
  return word.toUpperCase().replace(/[^A-Z]/g, "");
}

export function generateWordSearch(
  words: string[],
  size: number,
): WordSearchGrid {
  const clean = Array.from(
    new Set(
      words.map(sanitizeWord).filter((w) => w.length >= 2 && w.length <= size),
    ),
  );

  // Seed from the (cleaned) words + size — same input always yields the same grid.
  const rand = mulberry32(xmur3(clean.join("|") + "#" + size));

  const grid: (string | null)[][] = Array.from({ length: size }, () =>
    Array<string | null>(size).fill(null),
  );
  const placed: PlacedWord[] = [];

  // Longest first packs better (deterministic: stable sort over a fixed list).
  const ordered = [...clean].sort((a, b) => b.length - a.length);

  for (const word of ordered) {
    for (let attempt = 0; attempt < 200; attempt++) {
      const dir = DIRECTIONS[Math.floor(rand() * DIRECTIONS.length)];
      const r0 = Math.floor(rand() * size);
      const c0 = Math.floor(rand() * size);

      const cells: { r: number; c: number }[] = [];
      let fits = true;
      for (let i = 0; i < word.length; i++) {
        const r = r0 + dir.dr * i;
        const c = c0 + dir.dc * i;
        if (r < 0 || r >= size || c < 0 || c >= size) {
          fits = false;
          break;
        }
        const existing = grid[r][c];
        if (existing !== null && existing !== word[i]) {
          fits = false;
          break;
        }
        cells.push({ r, c });
      }
      if (!fits) continue;

      for (let i = 0; i < word.length; i++) {
        grid[cells[i].r][cells[i].c] = word[i];
      }
      placed.push({ word, cells });
      break;
    }
  }

  // Fill the gaps with seeded random letters.
  const finalGrid: string[][] = grid.map((row) =>
    row.map((cell) => cell ?? LETTERS[Math.floor(rand() * 26)]),
  );

  return { size, grid: finalGrid, placed };
}
