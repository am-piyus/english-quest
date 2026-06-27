"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { OptionBankQuestion as OBQ } from "@/types/lesson";

/**
 * Option-bank dash-fill (Droplet 25.3.3.5; mobile redesign in Bucket 25.3.3).
 * Each sentence has one compact inline blank; tapping it opens a small picker
 * anchored at the blank (options can repeat across blanks, so it's a per-blank
 * picker, not a deplete-once bank). The picker is portalled to <body> so the
 * card's backdrop-blur containing block can't clip it.
 *
 * UI-only: the chosen option indices are still reported up as a JSON array (one
 * per blank) via onChange, byte-for-byte as before, so QuestionCard + the scoring
 * engine are untouched.
 */

const letter = (i: number) => (i < 26 ? String.fromCharCode(97 + i) : String(i + 1));

function parseChosen(value: string, n: number): (number | null)[] {
  let arr: unknown;
  try {
    arr = JSON.parse(value);
  } catch {
    arr = null;
  }
  return Array.from({ length: n }, (_, i) => {
    const v = Array.isArray(arr) ? arr[i] : null;
    return typeof v === "number" ? v : null;
  });
}

type Anchor = { top: number; bottom: number; left: number };

export default function OptionBankQuestion({
  options,
  items,
  value,
  onChange,
  showResult,
  locked,
}: {
  options: string[];
  items: OBQ["items"];
  value: string;
  onChange: (v: string) => void;
  showResult: boolean;
  locked: boolean;
}) {
  const chosen = parseChosen(value, items.length);
  const [open, setOpen] = useState<number | null>(null);
  const [anchor, setAnchor] = useState<Anchor | null>(null);

  // Close the picker on an outside tap, on any scroll (so it never floats out of
  // place), or on resize.
  useEffect(() => {
    if (open === null) return;
    const onDown = (e: Event) => {
      const t = e.target as Element | null;
      if (t?.closest("[data-ob-menu]") || t?.closest("[data-ob-blank]")) return;
      setOpen(null);
    };
    const close = () => setOpen(null);
    document.addEventListener("pointerdown", onDown, true);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("pointerdown", onDown, true);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  function fill(blank: number, option: number) {
    const next = [...chosen];
    next[blank] = option;
    onChange(JSON.stringify(next));
  }
  function clear(blank: number) {
    const next = [...chosen];
    next[blank] = null;
    onChange(JSON.stringify(next));
  }

  function openPicker(i: number, el: HTMLElement) {
    if (open === i) {
      setOpen(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setAnchor({ top: r.top, bottom: r.bottom, left: r.left });
    setOpen(i);
  }

  // The anchored picker, portalled to <body> so the card's backdrop-blur (a fixed
  // containing block + stacking context) can't clip or mis-position it.
  let picker: ReactNode = null;
  if (open !== null && anchor && typeof window !== "undefined") {
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    const spaceBelow = vh - anchor.bottom;
    const openUp = spaceBelow < 240 && anchor.top > 240;
    const left = Math.min(Math.max(8, anchor.left), Math.max(8, vw - 168));
    const pos = openUp
      ? { bottom: vh - anchor.top + 6, maxHeight: anchor.top - 16 }
      : { top: anchor.bottom + 6, maxHeight: spaceBelow - 16 };
    const current = chosen[open];
    const blank = open;

    picker = (
      <ul
        data-ob-menu
        role="listbox"
        style={{ position: "fixed", left, maxWidth: "calc(100vw - 16px)", ...pos }}
        className="z-50 w-max min-w-[9rem] overflow-y-auto rounded-xl bg-surface p-1 shadow-lg ring-1 ring-ink/15"
      >
        {options.map((opt, o) => (
          <li key={o}>
            <button
              type="button"
              role="option"
              aria-selected={current === o}
              onClick={() => {
                fill(blank, o);
                setOpen(null);
              }}
              className={`flex min-h-[44px] w-full items-center rounded-lg px-3 text-left text-sm font-medium transition ${
                current === o ? "bg-brand text-white" : "text-ink hover:bg-brand-soft"
              }`}
            >
              {opt}
            </button>
          </li>
        ))}
        {current !== null && (
          <li>
            <button
              type="button"
              onClick={() => {
                clear(blank);
                setOpen(null);
              }}
              className="flex min-h-[44px] w-full items-center rounded-lg px-3 text-left text-sm font-medium text-ink-soft transition hover:bg-paper-2"
            >
              ✕ Clear
            </button>
          </li>
        )}
      </ul>
    );
  }

  return (
    <div className="space-y-3">
      <ol className="list-none space-y-2.5">
        {items.map((item, i) => {
          const parts = item.text.split("___");
          const pick = chosen[i];
          const isCorrect = showResult && pick === item.answer;
          const isWrong = showResult && pick !== item.answer;
          const interactive = !showResult && !locked;

          let blankCls = "bg-surface text-ink-soft ring-1 ring-ink/30";
          if (pick !== null && interactive)
            blankCls = "bg-brand-soft text-ink ring-1 ring-brand/50";
          if (open === i) blankCls = "bg-brand-soft text-ink ring-2 ring-brand";
          if (isCorrect) blankCls = "bg-success-soft text-ink ring-2 ring-success/60";
          if (isWrong) blankCls = "bg-paper-2 text-ink-soft ring-2 ring-ink/25";

          return (
            <li key={i} className="text-sm leading-8 text-ink">
              <span className="mr-1 font-semibold text-ink-soft">
                ({letter(i)})
              </span>
              <span>{parts[0]}</span>
              <button
                type="button"
                data-ob-blank
                disabled={locked}
                aria-haspopup="listbox"
                aria-expanded={open === i}
                aria-label={`Blank ${i + 1}${
                  pick !== null ? `, ${options[pick]}` : ", empty"
                }${interactive ? " — tap to choose" : ""}`}
                onClick={(e) => openPicker(i, e.currentTarget)}
                className={`mx-0.5 inline-flex min-w-[2.75rem] items-center justify-center gap-1 whitespace-nowrap rounded-md px-2 py-1 align-middle text-sm font-semibold ring-1 transition ${blankCls}`}
              >
                {pick !== null ? options[pick] : <span aria-hidden>·····</span>}
                {interactive && (
                  <span aria-hidden className="text-xs text-ink-soft">
                    ▾
                  </span>
                )}
              </button>
              <span>{parts.slice(1).join("___")}</span>
              {isCorrect && (
                <span className="ml-1 font-bold text-success" aria-hidden>
                  ✓
                </span>
              )}
              {isWrong && (
                <span className="ml-1 font-bold text-ink-soft" aria-hidden>
                  ↻
                </span>
              )}
            </li>
          );
        })}
      </ol>

      {!showResult && (
        <p className="text-xs text-ink-soft">Tap a blank to choose its word.</p>
      )}

      {picker && typeof document !== "undefined" && createPortal(picker, document.body)}
    </div>
  );
}
