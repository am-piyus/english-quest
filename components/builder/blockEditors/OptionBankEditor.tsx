"use client";

import type { OptionBankQuestion } from "@/types/lesson";
import { fieldClass } from "@/components/builder/fields";

/**
 * Option-bank editor (Droplet 25.3.3.5): edit the shared option bank and the
 * sentences (each with one "___" blank + which option fills it). Plugs into
 * AssignmentEditor's QuestionEditor.
 */
export default function OptionBankEditor({
  value,
  onChange,
}: {
  value: OptionBankQuestion;
  onChange: (q: OptionBankQuestion) => void;
}) {
  function setOptions(options: string[]) {
    // Keep each item's answer index in range if an option was removed.
    const max = Math.max(0, options.length - 1);
    const items = value.items.map((it) => ({
      ...it,
      answer: Math.min(it.answer, max),
    }));
    onChange({ ...value, options, items });
  }
  function setItems(items: OptionBankQuestion["items"]) {
    onChange({ ...value, items });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <span className="block text-sm font-semibold text-ink">Option bank</span>
        {value.options.map((opt, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              className={fieldClass}
              value={opt}
              placeholder={`Option ${i + 1}`}
              onChange={(e) => {
                const o = [...value.options];
                o[i] = e.target.value;
                setOptions(o);
              }}
            />
            {value.options.length > 2 && (
              <button
                type="button"
                onClick={() => setOptions(value.options.filter((_, idx) => idx !== i))}
                className="shrink-0 text-ink-soft hover:text-danger"
                aria-label={`Remove option ${i + 1}`}
              >
                ✕
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => setOptions([...value.options, ""])}
          className="text-sm font-semibold text-brand-dark hover:underline"
        >
          + Add option
        </button>
      </div>

      <div className="space-y-2">
        <span className="block text-sm font-semibold text-ink">
          Sentences (use ___ for the blank)
        </span>
        {value.items.map((item, i) => (
          <div key={i} className="space-y-2 rounded-xl bg-surface p-2 ring-1 ring-ink/10">
            <input
              className={fieldClass}
              value={item.text}
              placeholder="She ___ to school every day."
              onChange={(e) => {
                const items = [...value.items];
                items[i] = { ...item, text: e.target.value };
                setItems(items);
              }}
            />
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-ink-soft">
                Answer
                <select
                  className="rounded-lg bg-paper-2 px-2 py-1 text-sm text-ink ring-1 ring-ink/10"
                  value={item.answer}
                  onChange={(e) => {
                    const items = [...value.items];
                    items[i] = { ...item, answer: Number(e.target.value) };
                    setItems(items);
                  }}
                >
                  {value.options.map((opt, o) => (
                    <option key={o} value={o}>
                      {opt || `Option ${o + 1}`}
                    </option>
                  ))}
                </select>
              </label>
              {value.items.length > 1 && (
                <button
                  type="button"
                  onClick={() => setItems(value.items.filter((_, idx) => idx !== i))}
                  className="ml-auto text-xs font-semibold text-danger hover:underline"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setItems([...value.items, { text: "", answer: 0 }])}
          className="text-sm font-semibold text-brand-dark hover:underline"
        >
          + Add sentence
        </button>
      </div>
    </div>
  );
}
