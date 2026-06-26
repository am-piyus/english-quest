"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { WordSearch } from "@/types/lesson";
import { generateWordSearch } from "@/lib/wordSearch";
import { scoreWordSearchWord } from "@/lib/scoringEngine";

/**
 * Word-search puzzle block (Droplet 25.3.3.6; selection reworked in 25.3.3.10).
 * The grid is generated deterministically from the words, so everyone opening the
 * same session sees the same puzzle.
 *
 * Selection is per-letter and prefix-validated: the player taps cells one at a
 * time and after each tap the running path is checked — by CELL POSITION, never
 * by letter (the grid has filler letters) — against every unfound word's cell
 * path in both directions. On track → the path lights amber; completing a word
 * locks it green; a tap that can't continue any word flashes the attempt red and
 * resets. Cell <button>s keep it keyboard- and pointer-accessible. Scoring and
 * generation are untouched.
 */

type Cell = { r: number; c: number };
const key = (r: number, c: number) => `${r},${c}`;
const sameCell = (a: Cell, b: Cell) => a.r === b.r && a.c === b.c;

export default function WordSearchBlock({
  wordsearch,
}: {
  wordsearch: WordSearch;
}) {
  const { words, gridSize, title } = wordsearch;
  const puzzle = useMemo(
    () => generateWordSearch(words, gridSize),
    [words, gridSize],
  );

  const [path, setPath] = useState<Cell[]>([]);
  const [found, setFound] = useState<string[]>([]);
  const [miss, setMiss] = useState<{ keys: string[]; token: number } | null>(null);

  const missTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const missToken = useRef(0);

  useEffect(
    () => () => {
      if (missTimer.current) clearTimeout(missTimer.current);
    },
    [],
  );

  const foundCells = useMemo(() => {
    const s = new Set<string>();
    for (const p of puzzle.placed) {
      if (found.includes(p.word)) for (const c of p.cells) s.add(key(c.r, c.c));
    }
    return s;
  }, [found, puzzle]);

  const pathKeys = useMemo(
    () => new Set(path.map((c) => key(c.r, c.c))),
    [path],
  );
  const missKeys = useMemo(() => new Set(miss?.keys ?? []), [miss]);

  function clearMiss() {
    if (missTimer.current) {
      clearTimeout(missTimer.current);
      missTimer.current = null;
    }
    setMiss(null);
  }

  function flashMiss(cells: Cell[]) {
    const token = ++missToken.current;
    setMiss({ keys: cells.map((c) => key(c.r, c.c)), token });
    if (missTimer.current) clearTimeout(missTimer.current);
    missTimer.current = setTimeout(() => {
      setMiss((m) => (m && m.token === token ? null : m));
      missTimer.current = null;
    }, 450);
  }

  /**
   * Validate a candidate path (cells in tap order) by CELL POSITION against every
   * unfound word — both its forward and reversed cell path. On track when at
   * least one word's first `p.length` cells equal the path; completed when one of
   * those matches the path exactly (same length).
   */
  function evaluate(p: Cell[]): { onTrack: boolean; completed: string | null } {
    let onTrack = false;
    let completed: string | null = null;
    for (const placed of puzzle.placed) {
      if (found.includes(placed.word)) continue;
      for (const ordering of [placed.cells, [...placed.cells].reverse()]) {
        if (ordering.length < p.length) continue;
        let prefix = true;
        for (let i = 0; i < p.length; i++) {
          if (ordering[i].r !== p[i].r || ordering[i].c !== p[i].c) {
            prefix = false;
            break;
          }
        }
        if (!prefix) continue;
        onTrack = true;
        if (ordering.length === p.length) completed = placed.word;
      }
    }
    return { onTrack, completed };
  }

  function tap(r: number, c: number) {
    const cell = { r, c };
    clearMiss(); // a fresh tap clears any lingering red flash

    // Tapping the current start cell again cancels the in-progress path.
    if (path.length > 0 && sameCell(cell, path[0])) {
      setPath([]);
      return;
    }

    const candidate = [...path, cell];
    const { onTrack, completed } = evaluate(candidate);

    if (!onTrack) {
      flashMiss(candidate); // wrong → flash the whole attempt red, then reset
      setPath([]);
      return;
    }
    if (completed) {
      const word = completed;
      setFound((f) => (f.includes(word) ? f : [...f, word])); // lock it green
      setPath([]);
      return;
    }
    setPath(candidate); // on track → amber
  }

  const total = puzzle.placed.length;
  const stars = found.length * scoreWordSearchWord();

  return (
    <section className="eq-card p-5 sm:p-6">
      <span className="eq-chip mb-3">🔎 Word search</span>
      {title && <h2 className="text-xl font-bold text-ink">{title}</h2>}
      <p className="mt-1 text-sm text-ink-soft">
        Find the words — tap the letters in order. On track turns{" "}
        <span className="font-semibold text-amber">amber</span>; a wrong tap
        flashes red and resets.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {puzzle.placed.map((p) => {
          const got = found.includes(p.word);
          return (
            <span
              key={p.word}
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
                got
                  ? "bg-success-soft text-ink line-through ring-success/50"
                  : "bg-paper-2 text-ink ring-ink/15"
              }`}
            >
              {p.word}
            </span>
          );
        })}
      </div>

      <div
        className="mt-4 select-none"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${puzzle.size}, minmax(0, 1fr))`,
          gap: "2px",
        }}
      >
        {puzzle.grid.map((row, r) =>
          row.map((letter, c) => {
            const k = key(r, c);
            // Priority: found (locked) > miss (flash) > path (on track) > base.
            let cls = "bg-surface text-ink ring-1 ring-ink/10";
            if (pathKeys.has(k)) cls = "bg-amber-soft text-ink ring-2 ring-amber";
            if (missKeys.has(k)) cls = "bg-danger-soft text-ink ring-2 ring-danger";
            if (foundCells.has(k))
              cls = "bg-success-soft text-ink ring-2 ring-success";
            return (
              <button
                key={k}
                type="button"
                onClick={() => tap(r, c)}
                aria-label={`Row ${r + 1}, column ${c + 1}: ${letter}`}
                className={`flex aspect-square items-center justify-center rounded text-[10px] font-bold transition-colors sm:text-xs ${cls}`}
              >
                {letter}
              </button>
            );
          }),
        )}
      </div>

      <p className="mt-3 text-sm font-semibold text-ink">
        {found.length} of {total} found
        {stars > 0 && <span className="text-amber"> · ⭐ {stars}</span>}
      </p>
    </section>
  );
}
