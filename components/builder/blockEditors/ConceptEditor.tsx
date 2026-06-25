"use client";

import type { Concept } from "@/types/lesson";
import { TextField, TextArea, splitLines } from "@/components/builder/fields";

export default function ConceptEditor({
  value,
  onChange,
}: {
  value: Concept;
  onChange: (c: Concept) => void;
}) {
  return (
    <div className="space-y-3">
      <TextField
        label="Title"
        value={value.title}
        onChange={(title) => onChange({ ...value, title })}
        placeholder="He, she, it: add -s"
      />
      <TextArea
        label="Explanation"
        rows={4}
        value={value.explanation}
        onChange={(explanation) => onChange({ ...value, explanation })}
        placeholder="Explain the idea… (blank line = new paragraph)"
      />
      <TextArea
        label="Examples (one per line, optional)"
        value={(value.examples ?? []).join("\n")}
        onChange={(v) => onChange({ ...value, examples: splitLines(v) })}
        placeholder={"She works.\nHe goes."}
      />
      <TextField
        label="Tip (optional)"
        value={value.note ?? ""}
        onChange={(note) => onChange({ ...value, note })}
        placeholder="A key insight to remember"
      />
    </div>
  );
}
