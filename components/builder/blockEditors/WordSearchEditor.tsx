"use client";

import type { WordSearch } from "@/types/lesson";
import { TextField, fieldClass } from "@/components/builder/fields";

/**
 * Word-search editor (Droplet 25.3.3.6): a list of words (5 by default) and an
 * optional title. The grid is fixed at 15×15 for the MVP (the WordSearch type
 * carries gridSize, so making it configurable later is a UI-only change).
 */
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

      <div className="space-y-2">
        <span className="block text-sm font-semibold text-ink">
          Words (15×15 grid)
        </span>
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
        2–15 letters each. The grid is generated automatically and is identical
        for everyone who opens the session.
      </p>
    </div>
  );
}
