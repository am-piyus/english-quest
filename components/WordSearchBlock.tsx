"use client";

import { useMemo, useState } from "react";
import type { WordSearch } from "@/types/lesson";
import { generateWordSearch } from "@/lib/wordSearch";
import { scoreWordSearchWord } from "@/lib/scoringEngine";

/**
 * Word-search puzzle block (Droplet 25.3.3.6). The grid is generated
 * deterministically from the words, so everyone opening the same session sees
 * the same puzzle. Selection is tap-the-two-endpoints (reliable on touch and
 * desktop); a run that exactly covers a placed word's cells (in either
 * direction) marks it found and scores it. Self-contained for now — wiring the
 * found words into the session result is 25.3.3.7.
 */

type Cell = { r: number; c: number };
const key = (r: number, c: number) => `${r},${c}`;

function isStraight(a: Cell, b: Cell): boolean {
  return a.r === b.r || a.c === b.c || Math.abs(a.r - b.r) === Math.abs(a.c - b.c);
}

function lineCells(a: Cell, b: Cell): Cell[] {
  const dr = Math.sign(b.r - a.r);
  const dc = Math.sign(b.c - a.c);
  const steps = Math.max(Math.abs(b.r - a.r), Math.abs(b.c - a.c));
  return Array.from({ length: steps + 1 }, (_, i) => ({
    r: a.r + dr * i,
    c: a.c + dc * i,
  }));
}

function cellsEqual(x: Cell[], y: Cell[]): boolean {
  return x.length === y.length && x.every((c, i) => c.r === y[i].r && c.c === y[i].c);
}

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
  const [start, setStart] = useState<Cell | null>(null);
  const [found, setFound] = useState<string[]>([]);

  const foundCells = useMemo(() => {
    const s = new Set<string>();
    for (const p of puzzle.placed) {
      if (found.includes(p.word)) {
        for (const c of p.cells) s.add(key(c.r, c.c));
      }
    }
    return s;
  }, [found, puzzle]);

  function tap(r: number, c: number) {
    const cell = { r, c };
    if (!start) {
      setStart(cell);
      return;
    }
    if (start.r === r && start.c === c) {
      setStart(null); // tap the start again to cancel
      return;
    }
    if (!isStraight(start, cell)) {
      setStart(cell); // not a line — re-aim from here
      return;
    }
    const run = lineCells(start, cell);
    const reversed = [...run].reverse();
    const match = puzzle.placed.find(
      (p) =>
        !found.includes(p.word) &&
        (cellsEqual(run, p.cells) || cellsEqual(reversed, p.cells)),
    );
    if (match) setFound((f) => [...f, match.word]);
    setStart(null);
  }

  const total = puzzle.placed.length;
  const stars = found.length * scoreWordSearchWord();

  return (
    <section className="eq-card p-5 sm:p-6">
      <span className="eq-chip mb-3">🔎 Word search</span>
      {title && <h2 className="text-xl font-bold text-ink">{title}</h2>}
      <p className="mt-1 text-sm text-ink-soft">
        Find the words — tap the first letter, then the last.
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
            const isFound = foundCells.has(key(r, c));
            const isStart = start?.r === r && start?.c === c;
            let cls = "bg-surface text-ink ring-1 ring-ink/10";
            if (isFound) cls = "bg-success-soft text-ink ring-1 ring-success/40";
            if (isStart) cls = "bg-brand text-white";
            return (
              <button
                key={key(r, c)}
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
