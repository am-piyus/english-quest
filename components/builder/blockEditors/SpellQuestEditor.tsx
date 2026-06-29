"use client";

import type { SpellQuest, SpellWord } from "@/types/lesson";
import { sanitizeSpellWords } from "@/lib/spellQuest";
import { TextField, Labeled, fieldClass } from "@/components/builder/fields";

/**
 * SpellQuest editor (V1) — mirrors the word-search word-list editor: a list of
 * words with add/remove, plus an optional per-word hint and example sentence. The
 * round plays the whole list, or a seeded subset when a cap is set (so a shared
 * session is identical for everyone). The level is a display label only.
 */

const LEVELS: NonNullable<SpellQuest["level"]>[] = ["Beginner", "Intermediate"];

export default function SpellQuestEditor({
  value,
  onChange,
}: {
  value: SpellQuest;
  onChange: (s: SpellQuest) => void;
}) {
  const usable = sanitizeSpellWords(value.words).length;

  function setWord(i: number, patch: Partial<SpellWord>) {
    const words = value.words.map((w, idx) => (idx === i ? { ...w, ...patch } : w));
    onChange({ ...value, words });
  }

  return (
    <div className="space-y-3">
      <TextField
        label="Title (optional)"
        value={value.title ?? ""}
        onChange={(title) => onChange({ ...value, title })}
        placeholder="Spelling practice"
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <Labeled label="Level (display only)">
          <select
            className={fieldClass}
            value={value.level ?? "Beginner"}
            onChange={(e) =>
              onChange({ ...value, level: e.target.value as SpellQuest["level"] })
            }
          >
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </Labeled>
        <Labeled label={`Round size (blank = all ${usable})`}>
          <input
            type="number"
            min={1}
            className={fieldClass}
            value={value.count ?? ""}
            placeholder="all"
            onChange={(e) => {
              const n = Number(e.target.value);
              onChange({
                ...value,
                count: e.target.value.trim() === "" || !Number.isFinite(n) || n < 1
                  ? undefined
                  : Math.floor(n),
              });
            }}
          />
        </Labeled>
      </div>

      <div className="space-y-3">
        <span className="block text-sm font-semibold text-ink">Words</span>
        {value.words.map((w, i) => (
          <div key={i} className="space-y-2 rounded-2xl bg-paper-2 p-3">
            <div className="flex items-center gap-2">
              <input
                className={fieldClass}
                value={w.word}
                placeholder={`Word ${i + 1}`}
                spellCheck={false}
                autoCapitalize="off"
                onChange={(e) => setWord(i, { word: e.target.value })}
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
            <input
              className={fieldClass}
              value={w.hint ?? ""}
              placeholder="Hint / definition (optional)"
              onChange={(e) => setWord(i, { hint: e.target.value })}
            />
            <input
              className={fieldClass}
              value={w.example ?? ""}
              placeholder="Example sentence (optional — the word is hidden when shown)"
              onChange={(e) => setWord(i, { example: e.target.value })}
            />
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            onChange({ ...value, words: [...value.words, { word: "" }] })
          }
          className="text-sm font-semibold text-brand-dark hover:underline"
        >
          + Add word
        </button>
      </div>

      <p className="text-xs text-ink-soft">
        {usable === 0
          ? "Add at least one word (2+ letters). The learner hears the word and types it — the spelling is never shown."
          : `${usable} word${usable === 1 ? "" : "s"} ready. Letters (with ' or -) only; 2–40 characters.`}
      </p>
    </div>
  );
}
