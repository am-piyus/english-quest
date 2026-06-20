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
  responses,
  onAnswer,
}: {
  assignment: Assignment;
  responses: ResponseMap;
  onAnswer: (result: AnswerResult) => void;
}) {
  return (
    <section className="eq-card p-6 sm:p-8">
      <span className="eq-chip mb-3">✏️ {assignment.title}</span>
      {assignment.intro && <p className="text-ink-soft">{assignment.intro}</p>}

      <div className="mt-4 space-y-4">
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
