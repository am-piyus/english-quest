"use client";

import { useState } from "react";
import type { OptionBankQuestion as OBQ } from "@/types/lesson";

/**
 * Option-bank dash-fill (Droplet 25.3.3.5): tap a blank to select it, then tap
 * an option from the bank to fill it. The chosen indices are reported up as a
 * JSON array (one per blank) so QuestionCard scores it via the engine. Renders
 * inside QuestionCard like every other question type.
 */

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
  const [active, setActive] = useState<number>(() => {
    const empty = chosen.findIndex((c) => c === null);
    return empty === -1 ? 0 : empty;
  });

  function fill(blank: number, option: number) {
    const next = [...chosen];
    next[blank] = option;
    onChange(JSON.stringify(next));
    const empty = next.findIndex((c) => c === null);
    setActive(empty === -1 ? blank : empty);
  }
  function clear(blank: number) {
    const next = [...chosen];
    next[blank] = null;
    onChange(JSON.stringify(next));
    setActive(blank);
  }

  return (
    <div className="space-y-4">
      <ol className="space-y-2.5">
        {items.map((item, i) => {
          const parts = item.text.split("___");
          const pick = chosen[i];
          const isCorrect = showResult && pick === item.answer;
          const isWrong = showResult && pick !== item.answer;

          let blankCls = "bg-surface text-ink ring-ink/25";
          if (active === i && !showResult) blankCls = "bg-brand-soft text-ink ring-brand";
          if (isCorrect) blankCls = "bg-success-soft text-ink ring-2 ring-success/60";
          if (isWrong) blankCls = "bg-paper-2 text-ink-soft ring-2 ring-ink/25";

          return (
            <li key={i} className="flex flex-wrap items-center gap-1.5 text-sm text-ink">
              <span>{parts[0]}</span>
              <button
                type="button"
                disabled={locked}
                onClick={() => (pick === null ? setActive(i) : clear(i))}
                className={`min-h-[36px] min-w-[64px] rounded-lg px-3 py-1 text-center font-medium ring-1 transition ${blankCls}`}
                aria-label={`Blank ${i + 1}${pick !== null ? `: ${options[pick]}` : ", empty"}`}
              >
                {pick !== null ? options[pick] : "＿＿"}
              </button>
              <span>{parts[1] ?? ""}</span>
              {isCorrect && (
                <span className="font-bold text-success" aria-hidden>
                  ✓
                </span>
              )}
              {isWrong && (
                <span className="font-bold text-ink-soft" aria-hidden>
                  ↻
                </span>
              )}
            </li>
          );
        })}
      </ol>

      <div className="flex flex-wrap gap-2">
        {options.map((opt, o) => (
          <button
            key={o}
            type="button"
            disabled={locked}
            onClick={() => fill(active, o)}
            className="min-h-[40px] rounded-full bg-paper-2 px-3.5 py-1.5 text-sm font-medium text-ink ring-1 ring-ink/15 transition hover:bg-brand-soft disabled:opacity-50"
          >
            {opt}
          </button>
        ))}
      </div>

      {!showResult && (
        <p className="text-xs text-ink-soft">
          Tap a blank, then tap an option to fill it.
        </p>
      )}
    </div>
  );
}
