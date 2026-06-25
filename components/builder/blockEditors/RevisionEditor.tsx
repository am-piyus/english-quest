"use client";

import type { Revision } from "@/types/lesson";
import { TextField, TextArea } from "@/components/builder/fields";

export default function RevisionEditor({
  value,
  onChange,
}: {
  value: Revision;
  onChange: (r: Revision) => void;
}) {
  return (
    <div className="space-y-3">
      <TextField
        label="Title (optional)"
        value={value.title ?? ""}
        onChange={(title) => onChange({ ...value, title })}
        placeholder="Quick revision"
      />
      <TextArea
        label="Recap"
        value={value.summary}
        onChange={(summary) => onChange({ ...value, summary })}
        placeholder="A short recap… (leave a blank line to start a new paragraph)"
      />
      <TextField
        label="Revisits day (optional)"
        value={value.refDay != null ? String(value.refDay) : ""}
        onChange={(v) => {
          const n = Number(v);
          onChange({
            ...value,
            refDay: v.trim() === "" || !Number.isFinite(n) ? undefined : n,
          });
        }}
        placeholder="e.g. 1"
      />
    </div>
  );
}
