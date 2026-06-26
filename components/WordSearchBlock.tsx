"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  PointerEvent as ReactPointerEvent,
  KeyboardEvent as ReactKeyboardEvent,
} from "react";
import type { WordSearch } from "@/types/lesson";
import { generateWordSearch } from "@/lib/wordSearch";
import { scoreWordSearchWord } from "@/lib/scoringEngine";

/**
 * Word-search puzzle block (Droplet 25.3.3.6, interaction reworked in 25.3.3.10).
 * The grid is generated deterministically from the words, so everyone opening the
 * same session sees the same puzzle. Selection is DRAG-to-select with a live path
 * highlight (pointer down → move → up); tap-the-two-endpoints still works as an
 * accessible fallback (including keyboard). A run that exactly covers a placed
 * word's cells (either direction) marks it found and scores it; a non-matching
 * selection gives a brief miss flash instead of a silent reset.
 */

type Cell = { r: number; c: number };
const key = (r: number, c: number) => `${r},${c}`;
const sameCell = (a: Cell | null, b: Cell | null) =>
  !!a && !!b && a.r === b.r && a.c === b.c;

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

  const [anchor, setAnchor] = useState<Cell | null>(null);
  const [cursor, setCursor] = useState<Cell | null>(null);
  const [found, setFound] = useState<string[]>([]);
  const [miss, setMiss] = useState<{ cells: string[]; token: number } | null>(null);

  // Refs mirror the in-flight press so the pointer handlers never read stale
  // state between renders (React re-creates the closures each render).
  const anchorRef = useRef<Cell | null>(null);
  const pressingRef = useRef(false);
  const press = useRef<{
    start: Cell;
    last: Cell;
    moved: boolean;
    hadAnchor: boolean;
  } | null>(null);
  const missTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const missToken = useRef(0);

  useEffect(() => () => {
    if (missTimer.current) clearTimeout(missTimer.current);
  }, []);

  function setAnchorBoth(v: Cell | null) {
    anchorRef.current = v;
    setAnchor(v);
  }
  function clearSelection() {
    setAnchorBoth(null);
    setCursor(null);
  }

  const foundCells = useMemo(() => {
    const s = new Set<string>();
    for (const p of puzzle.placed) {
      if (found.includes(p.word)) for (const c of p.cells) s.add(key(c.r, c.c));
    }
    return s;
  }, [found, puzzle]);

  // The line the player is about to pick (anchor → cursor). Off a straight line,
  // just the anchor lights up — a clear "not a valid run yet" signal.
  const previewCells = useMemo(() => {
    if (!anchor) return new Set<string>();
    if (!cursor || sameCell(anchor, cursor) || !isStraight(anchor, cursor)) {
      return new Set([key(anchor.r, anchor.c)]);
    }
    return new Set(lineCells(anchor, cursor).map((c) => key(c.r, c.c)));
  }, [anchor, cursor]);

  const missCells = useMemo(() => new Set(miss?.cells ?? []), [miss]);

  function flashMiss(cells: Cell[]) {
    const token = ++missToken.current;
    setMiss({ cells: cells.map((c) => key(c.r, c.c)), token });
    if (missTimer.current) clearTimeout(missTimer.current);
    missTimer.current = setTimeout(() => {
      setMiss((m) => (m && m.token === token ? null : m));
    }, 480);
  }

  function commit(a: Cell | null, b: Cell | null) {
    if (!a || !b || sameCell(a, b)) {
      clearSelection();
      return;
    }
    if (!isStraight(a, b)) {
      flashMiss([a, b]);
      clearSelection();
      return;
    }
    const run = lineCells(a, b);
    const reversed = [...run].reverse();
    const match = puzzle.placed.find(
      (p) =>
        !found.includes(p.word) &&
        (cellsEqual(run, p.cells) || cellsEqual(reversed, p.cells)),
    );
    if (match) setFound((f) => [...f, match.word]);
    else flashMiss(run);
    clearSelection();
  }

  /** The grid cell under a pointer, via hit-testing (works through capture). */
  function cellFromEvent(e: ReactPointerEvent): Cell | null {
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const cellEl = el?.closest<HTMLElement>("[data-r]");
    if (!cellEl) return null;
    const r = Number(cellEl.dataset.r);
    const c = Number(cellEl.dataset.c);
    return Number.isInteger(r) && Number.isInteger(c) ? { r, c } : null;
  }

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    const cell = cellFromEvent(e);
    if (!cell) return;
    pressingRef.current = true;
    press.current = {
      start: cell,
      last: cell,
      moved: false,
      hadAnchor: anchorRef.current != null,
    };
    if (anchorRef.current == null) setAnchorBoth(cell);
    setCursor(cell);
    // Capture so move/up keep firing even if the finger leaves the grid; cells
    // are still resolved by hit-testing in cellFromEvent.
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* capture unsupported — drag still works via move hit-testing */
    }
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!pressingRef.current || !press.current) return;
    const cell = cellFromEvent(e);
    if (!cell || sameCell(cell, press.current.last)) return;
    press.current.last = cell;
    if (!sameCell(cell, press.current.start)) {
      if (!press.current.moved && press.current.hadAnchor) {
        // A new drag begun while an earlier tap was pending → re-anchor to it.
        setAnchorBoth(press.current.start);
      }
      press.current.moved = true;
    }
    setCursor(cell);
  }

  function onPointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    if (!pressingRef.current || !press.current) return;
    pressingRef.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* nothing captured */
    }
    const { start, last, moved, hadAnchor } = press.current;
    press.current = null;
    if (moved) {
      commit(anchorRef.current, last); // drag
    } else if (hadAnchor) {
      commit(anchorRef.current, start); // second tap of tap-two-endpoints
    } else {
      setCursor(null); // first tap — keep the anchor, wait for the second
    }
  }

  function onPointerCancel() {
    pressingRef.current = false;
    press.current = null;
    clearSelection();
  }

  // Keyboard fallback: Enter/Space picks the first then the last letter.
  function onCellKeyDown(e: ReactKeyboardEvent<HTMLButtonElement>, r: number, c: number) {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    const cell = { r, c };
    const a = anchorRef.current;
    if (!a) {
      setAnchorBoth(cell);
      setCursor(cell);
    } else if (sameCell(a, cell)) {
      clearSelection();
    } else {
      commit(a, cell);
    }
  }

  const total = puzzle.placed.length;
  const stars = found.length * scoreWordSearchWord();

  return (
    <section className="eq-card p-5 sm:p-6">
      <span className="eq-chip mb-3">🔎 Word search</span>
      {title && <h2 className="text-xl font-bold text-ink">{title}</h2>}
      <p className="mt-1 text-sm text-ink-soft">
        Find the words — drag across the letters, or tap the first and the last.
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
        className="mt-4 touch-none select-none"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${puzzle.size}, minmax(0, 1fr))`,
          gap: "2px",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
      >
        {puzzle.grid.map((row, r) =>
          row.map((letter, c) => {
            const k = key(r, c);
            const isAnchor = sameCell(anchor, { r, c });
            let cls = "bg-surface text-ink ring-1 ring-ink/10";
            if (previewCells.has(k)) {
              cls = isAnchor
                ? "bg-brand text-white ring-1 ring-brand"
                : "bg-brand/25 text-ink ring-1 ring-brand/50";
            }
            if (missCells.has(k)) cls = "bg-danger/20 text-ink ring-1 ring-danger/70";
            if (foundCells.has(k)) cls = "bg-success-soft text-ink ring-1 ring-success/40";
            return (
              <button
                key={k}
                type="button"
                data-r={r}
                data-c={c}
                onKeyDown={(e) => onCellKeyDown(e, r, c)}
                aria-label={`Row ${r + 1}, column ${c + 1}: ${letter}`}
                className={`flex aspect-square touch-none items-center justify-center rounded text-[10px] font-bold transition-colors sm:text-xs ${cls}`}
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
