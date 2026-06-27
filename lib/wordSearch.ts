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

  // Guarantee each bank word appears only at its placement — never a second,
  // coincidental copy from filler letters that the matcher would reject.
  clearStrayWords(finalGrid, placed, clean, size, rand);

  return { size, grid: finalGrid, placed };
}

// All 8 reading directions (the placement set is only 4; a stray can read any way).
const DIRS8 = [
  [0, 1],
  [0, -1],
  [1, 0],
  [-1, 0],
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
] as const;

/** Order-independent key for a set of cells, so the same run read in opposite
 *  directions (e.g. a palindrome over the placed cells) counts as one occurrence,
 *  not a stray. */
function cellSetKey(cells: { r: number; c: number }[], size: number): string {
  return cells
    .map((c) => c.r * size + c.c)
    .sort((a, b) => a - b)
    .join(",");
}

/**
 * Remove "stray" bank words: any occurrence of a bank word whose cell-set differs
 * from that word's placement. Strays are created when seeded filler letters
 * happen to spell a bank word again elsewhere (a real session produced two
 * "OWN"s). For each stray, re-letter ONE filler cell in it (never a placed word's
 * cell) with a seeded letter that doesn't itself complete any bank word through
 * that cell, then re-scan. Bounded and deterministic, so shared sessions still
 * regenerate the exact same grid. Strays that lie entirely on placed-word cells
 * (one bank word reading inside another's line) have no filler to change; they're
 * left best-effort — the cell-based matcher never treats them as a separate
 * tappable word anyway.
 */
function clearStrayWords(
  grid: string[][],
  placed: PlacedWord[],
  words: string[],
  size: number,
  rand: () => number,
): void {
  const placedCells = new Set<number>();
  for (const p of placed) for (const c of p.cells) placedCells.add(c.r * size + c.c);
  const isFiller = (r: number, c: number) => !placedCells.has(r * size + c);
  const inBounds = (r: number, c: number) =>
    r >= 0 && r < size && c >= 0 && c < size;

  // Each word's only allowed occurrence(s): its placement cell-set(s).
  const allowed = new Map<string, Set<string>>();
  for (const w of words) allowed.set(w, new Set());
  for (const p of placed) allowed.get(p.word)?.add(cellSetKey(p.cells, size));

  function findStrays(): { word: string; cells: { r: number; c: number }[] }[] {
    const strays: { word: string; cells: { r: number; c: number }[] }[] = [];
    const seen = new Set<string>();
    for (const word of words) {
      const L = word.length;
      const allow = allowed.get(word)!;
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          for (const [dr, dc] of DIRS8) {
            if (!inBounds(r + dr * (L - 1), c + dc * (L - 1))) continue;
            const cells: { r: number; c: number }[] = [];
            let ok = true;
            for (let i = 0; i < L; i++) {
              const rr = r + dr * i;
              const cc = c + dc * i;
              if (grid[rr][cc] !== word[i]) {
                ok = false;
                break;
              }
              cells.push({ r: rr, c: cc });
            }
            if (!ok) continue;
            const canon = cellSetKey(cells, size);
            if (allow.has(canon)) continue; // its real placement — fine
            const id = `${word}|${canon}`;
            if (!seen.has(id)) {
              seen.add(id);
              strays.push({ word, cells });
            }
          }
        }
      }
    }
    return strays;
  }

  // Letters that, placed at (r,c), would complete a bank word through it given
  // the rest of the grid — i.e. would (re)create a stray at this cell.
  function forbiddenAt(r: number, c: number): Set<string> {
    const forbid = new Set<string>();
    for (const word of words) {
      const L = word.length;
      for (const [dr, dc] of DIRS8) {
        for (let p = 0; p < L; p++) {
          const sr = r - dr * p;
          const sc = c - dc * p;
          let ok = true;
          for (let i = 0; i < L; i++) {
            if (i === p) continue;
            const rr = sr + dr * i;
            const cc = sc + dc * i;
            if (!inBounds(rr, cc) || grid[rr][cc] !== word[i]) {
              ok = false;
              break;
            }
          }
          if (ok) forbid.add(word[p]);
        }
      }
    }
    return forbid;
  }

  const CAP = size * size * 4; // safety bound — typical runs clear in a few passes
  for (let iter = 0; iter < CAP; iter++) {
    const strays = findStrays();
    if (strays.length === 0) break;
    let changed = false;
    for (const stray of strays) {
      for (const cell of stray.cells) {
        if (!isFiller(cell.r, cell.c)) continue; // never alter a placed word
        const forbid = forbiddenAt(cell.r, cell.c);
        const choices: string[] = [];
        for (const ch of LETTERS) if (!forbid.has(ch)) choices.push(ch);
        if (choices.length === 0) continue;
        grid[cell.r][cell.c] = choices[Math.floor(rand() * choices.length)];
        changed = true;
        break;
      }
      if (changed) break; // re-scan after each fix (one seeded draw per change)
    }
    if (!changed) break; // only placed-cell overlaps remain — best-effort
  }
}
