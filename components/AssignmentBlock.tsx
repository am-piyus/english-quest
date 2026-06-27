"use client";

import type { Assignment } from "@/types/lesson";
import type { ResponseMap, AnswerResult } from "@/types/question";
import QuestionCard from "@/components/QuestionCard";

/**
 * Interactive assignment: each question can be answered and checked in place,
 * with validation + scoring (Droplet 25.3.1.5). Results are lifted to the
 * session so progress and the end summary can use them. Droplet 25.3.1.6 adds
 * the animated feedback and star rewards layered on top of this.
 */
export default function AssignmentBlock({
  assignment,
  assignmentNumber = 1,
  responses,
  onAnswer,
}: {
  assignment: Assignment;
  assignmentNumber?: number;
  responses: ResponseMap;
  onAnswer: (result: AnswerResult) => void;
}) {
  return (
    <section className="eq-card p-5 sm:p-6">
      <span className="eq-chip mb-3">✏️ Assignment {assignmentNumber}</span>
      {assignment.title && (
        <h3 className="text-lg font-bold text-ink">{assignment.title}</h3>
      )}
      {assignment.intro && (
        <p className="mt-1 text-ink-soft">{assignment.intro}</p>
      )}

      {/* Self-contained, stable panel: scrolls internally if it's taller than the
          viewport. The option-bank picker is portalled to <body>, so this
          overflow never clips it. */}
      <div className="mt-4 max-h-[65vh] space-y-4 overflow-y-auto pr-0.5">
        {assignment.questions.map((q, i) => (
          <QuestionCard
            key={q.id}
            question={q}
            index={i}
            saved={responses[q.id]}
            onAnswer={onAnswer}
          />
        ))}
      </div>
    </section>
  );
}
