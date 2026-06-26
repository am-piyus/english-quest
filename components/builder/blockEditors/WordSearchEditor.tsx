"use client";

import type { WordSearch } from "@/types/lesson";
import { TextField, Labeled, fieldClass } from "@/components/builder/fields";

/**
 * Word-search editor (Droplet 25.3.3.6; grid-size selector added in 25.3.3.10).
 * A list of words (5 by default), an optional title, and a 10×10 / 15×15 size
 * choice. The grid itself is generated deterministically at play time.
 */

const SIZES: WordSearch["gridSize"][] = [10, 15];

export default function WordSearchEditor({
  value,
  onChange,
}: {
  value: WordSearch;
  onChange: (w: WordSearch) => void;
}) {
  function setWord(i: number, word: string) {
    const words = [...value.words];
    words[i] = word;
    onChange({ ...value, words });
  }

  return (
    <div className="space-y-3">
      <TextField
        label="Title (optional)"
        value={value.title ?? ""}
        onChange={(title) => onChange({ ...value, title })}
        placeholder="Find the verbs"
      />

      <Labeled label="Grid size">
        <select
          className={fieldClass}
          value={value.gridSize}
          onChange={(e) =>
            onChange({
              ...value,
              gridSize: Number(e.target.value) as WordSearch["gridSize"],
            })
          }
        >
          {SIZES.map((s) => (
            <option key={s} value={s}>
              {s}×{s}
            </option>
          ))}
        </select>
      </Labeled>

      <div className="space-y-2">
        <span className="block text-sm font-semibold text-ink">Words</span>
        {value.words.map((w, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              className={fieldClass}
              value={w}
              placeholder={`Word ${i + 1}`}
              onChange={(e) => setWord(i, e.target.value)}
            />
            {value.words.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  onChange({
                    ...value,
                    words: value.words.filter((_, idx) => idx !== i),
                  })
                }
                className="shrink-0 text-ink-soft hover:text-danger"
                aria-label={`Remove word ${i + 1}`}
              >
                ✕
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange({ ...value, words: [...value.words, ""] })}
          className="text-sm font-semibold text-brand-dark hover:underline"
        >
          + Add word
        </button>
      </div>

      <p className="text-xs text-ink-soft">
        2–{value.gridSize} letters each. The grid is generated automatically and
        is identical for everyone who opens the session.
      </p>
    </div>
  );
}
