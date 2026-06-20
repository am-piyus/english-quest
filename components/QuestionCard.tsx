"use client";

import { useState } from "react";
import type { Question } from "@/types/lesson";
import type { AnswerResult } from "@/types/question";
import { isCorrect } from "@/lib/answerValidator";
import { scoreQuestion } from "@/lib/scoringEngine";
import MCQQuestion from "@/components/MCQQuestion";
import TextQuestion from "@/components/TextQuestion";

export default function QuestionCard({
  question,
  index,
  saved,
  onAnswer,
}: {
  question: Question;
  index: number;
  saved?: AnswerResult;
  onAnswer: (result: AnswerResult) => void;
}) {
  const [answer, setAnswer] = useState(saved?.answer ?? "");
  const [checked, setChecked] = useState(Boolean(saved));
  const [correct, setCorrect] = useState(saved?.correct ?? false);

  const isReflection = question.type === "reflection";

  function update(value: string) {
    setAnswer(value);
    // Editing after a wrong attempt clears the feedback so they can re-check.
    if (!correct) setChecked(false);
  }

  function submit() {
    const ok = isCorrect(question, answer);
    setChecked(true);
    setCorrect(ok);
    onAnswer({
      questionId: question.id,
      answer,
      correct: ok,
      score: scoreQuestion(question, ok),
    });
  }

  const canSubmit = answer.trim().length > 0 && !(correct && checked);

  return (
    <div className="rounded-2xl bg-paper-2 p-4">
      <p className="text-sm font-semibold text-ink">
        {index + 1}. {question.prompt}
      </p>

      <div className="mt-3">
        {(question.type === "mcq" || question.type === "case") && (
          <MCQQuestion
            options={question.options}
            selected={answer}
            onSelect={update}
            correctIndex={question.answerIndex}
            showResult={checked}
            locked={correct}
          />
        )}

        {(question.type === "fill-blank" || question.type === "structure") && (
          <TextQuestion value={answer} onChange={update} disabled={correct} />
        )}

        {isReflection && (
          <TextQuestion
            value={answer}
            onChange={update}
            multiline
            placeholder="Write your thoughts…"
          />
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={submit}
          disabled={!canSubmit}
          className="eq-btn eq-btn-primary px-4 py-2 text-sm"
        >
          {isReflection ? "Save" : correct ? "Correct ✓" : "Check"}
        </button>

        {checked && (
          <span
            className={`text-sm font-semibold ${
              isReflection || correct ? "text-success" : "text-danger"
            }`}
          >
            {isReflection
              ? "✅ Saved"
              : correct
                ? "✅ Correct!"
                : "❌ Not quite — try again"}
          </span>
        )}
      </div>

      {checked && correct && question.type !== "reflection" && question.feedback && (
        <p className="mt-2 text-sm text-ink-soft">{question.feedback}</p>
      )}
      {checked && !correct && !isReflection && question.hint && (
        <p className="mt-2 text-sm text-ink-soft">💡 {question.hint}</p>
      )}
    </div>
  );
}
