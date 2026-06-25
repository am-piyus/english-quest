"use client";

import { useState } from "react";
import type { Section } from "@/types/lesson";
import RevisionEditor from "@/components/builder/blockEditors/RevisionEditor";
import ConceptEditor from "@/components/builder/blockEditors/ConceptEditor";
import AssignmentEditor from "@/components/builder/blockEditors/AssignmentEditor";

/**
 * Ordered block list for the builder (Droplet 25.3.3.4): add (in SessionBuilder),
 * reorder (drag or the ↑/↓ buttons for touch/a11y), delete, and edit each block
 * via its kind-specific editor. Extend by adding a KIND_LABEL entry + an editor
 * branch when a new Section kind lands (e.g. wordsearch in 25.3.3.6).
 */

const KIND_LABEL: Record<Section["kind"], string> = {
  revision: "🔁 Revision",
  concept: "📖 Concept",
  assignment: "✏️ Assignment",
};

export default function BlockList({
  sections,
  onChange,
}: {
  sections: Section[];
  onChange: (s: Section[]) => void;
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  function update(i: number, section: Section) {
    onChange(sections.map((s, idx) => (idx === i ? section : s)));
  }
  function remove(i: number) {
    onChange(sections.filter((_, idx) => idx !== i));
  }
  function move(from: number, to: number) {
    if (to < 0 || to >= sections.length) return;
    const next = [...sections];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  }

  if (sections.length === 0) {
    return (
      <p className="rounded-2xl bg-paper-2 px-4 py-6 text-center text-sm text-ink-soft">
        No blocks yet. Add a revision, concept, or assignment below.
      </p>
    );
  }

  const ctrlBtn =
    "inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink-soft ring-1 ring-ink/10 hover:bg-ink/5 disabled:opacity-30";

  return (
    <div className="space-y-4">
      {sections.map((section, i) => (
        <div
          key={i}
          draggable
          onDragStart={() => setDragIndex(i)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => {
            if (dragIndex !== null && dragIndex !== i) move(dragIndex, i);
            setDragIndex(null);
          }}
          className="eq-card p-4"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-sm font-bold text-ink">
              <span className="cursor-grab text-ink-soft" aria-hidden title="Drag to reorder">
                ⠿
              </span>
              {KIND_LABEL[section.kind]}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => move(i, i - 1)}
                disabled={i === 0}
                className={ctrlBtn}
                aria-label="Move block up"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => move(i, i + 1)}
                disabled={i === sections.length - 1}
                className={ctrlBtn}
                aria-label="Move block down"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => remove(i)}
                className="inline-flex h-9 items-center rounded-lg px-2.5 text-sm font-semibold text-danger ring-1 ring-danger/30 hover:bg-danger-soft"
                aria-label="Delete block"
              >
                Delete
              </button>
            </div>
          </div>

          {section.kind === "revision" && (
            <RevisionEditor
              value={section.revision}
              onChange={(revision) => update(i, { kind: "revision", revision })}
            />
          )}
          {section.kind === "concept" && (
            <ConceptEditor
              value={section.concept}
              onChange={(concept) => update(i, { kind: "concept", concept })}
            />
          )}
          {section.kind === "assignment" && (
            <AssignmentEditor
              value={section.assignment}
              onChange={(assignment) =>
                update(i, { kind: "assignment", assignment })
              }
            />
          )}
        </div>
      ))}
    </div>
  );
}
