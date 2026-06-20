import type { Assignment } from "@/types/lesson";

/**
 * Placeholder assignment view for Droplet 25.3.1.4 — it shows the questions in
 * read-only form. Droplet 25.3.1.5 turns this into the interactive assignment
 * engine (answer inputs, validation, scoring) and 25.3.1.6 adds instant feedback.
 */
export default function AssignmentBlock({
  assignment,
}: {
  assignment: Assignment;
}) {
  return (
    <section className="eq-card p-6 sm:p-8">
      <span className="eq-chip mb-3">✏️ {assignment.title}</span>
      {assignment.intro && <p className="text-ink-soft">{assignment.intro}</p>}

      <ol className="mt-4 space-y-3">
        {assignment.questions.map((q, i) => (
          <li key={q.id} className="rounded-2xl bg-paper-2 px-4 py-3">
            <span className="text-sm font-semibold text-ink">
              {i + 1}. {q.prompt}
            </span>
          </li>
        ))}
      </ol>

      <p className="mt-4 text-xs text-ink-soft">
        Interactive answering &amp; instant feedback unlock in the next step.
      </p>
    </section>
  );
}
