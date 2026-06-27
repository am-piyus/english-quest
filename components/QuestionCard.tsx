"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Question } from "@/types/lesson";
import type { AnswerResult } from "@/types/question";
import { isCorrect } from "@/lib/answerValidator";
import { scoreQuestion } from "@/lib/scoringEngine";
import { nudge, praise } from "@/lib/gamificationEngine";
import MCQQuestion from "@/components/MCQQuestion";
import TextQuestion from "@/components/TextQuestion";
import OptionBankQuestion from "@/components/OptionBankQuestion";
import StarReward from "@/components/StarReward";

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
  const [score, setScore] = useState(saved?.score ?? 0);

  const isReflection = question.type === "reflection";
  // Letter each question (a)(b)(c)… An option-bank letters its own sentences, so
  // it skips the question-level letter to avoid a confusing double label.
  const letter = index < 26 ? String.fromCharCode(97 + index) : String(index + 1);
  const showLetter = question.type !== "option-bank";

  function update(value: string) {
    setAnswer(value);
    // Editing after a wrong attempt clears the feedback so they can re-check.
    if (!correct) setChecked(false);
  }

  function submit() {
    const ok = isCorrect(question, answer);
    const earned = scoreQuestion(question, ok);
    setChecked(true);
    setCorrect(ok);
    setScore(earned);
    onAnswer({ questionId: question.id, answer, correct: ok, score: earned });
  }

  // An option-bank answer is "complete" only when every blank has a choice.
  function isAnswerComplete(): boolean {
    if (question.type !== "option-bank") return answer.trim().length > 0;
    try {
      const arr = JSON.parse(answer || "[]");
      return (
        Array.isArray(arr) &&
        question.items.length > 0 &&
        question.items.every((_, i) => typeof arr[i] === "number")
      );
    } catch {
      return false;
    }
  }
  const canSubmit = isAnswerComplete() && !(correct && checked);

  return (
    <div className="rounded-2xl bg-paper-2 p-4">
      <p className="text-sm font-semibold text-ink">
        {showLetter && <span className="text-ink-soft">({letter}) </span>}
        {question.prompt}
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
          <TextQuestion
            value={answer}
            onChange={update}
            disabled={correct}
            onSubmit={() => {
              if (canSubmit) submit();
            }}
          />
        )}

        {question.type === "option-bank" && (
          <OptionBankQuestion
            options={question.options}
            items={question.items}
            value={answer}
            onChange={update}
            showResult={checked}
            locked={correct}
          />
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
          className="eq-btn eq-btn-primary px-5 py-3 text-sm"
        >
          {isReflection ? "Save" : correct ? "Correct ✓" : "Check"}
        </button>

        <AnimatePresence mode="wait">
          {checked && (
            <motion.span
              key={`${correct}-${answer}`}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className={`flex items-center gap-1.5 text-sm font-semibold ${
                isReflection || correct ? "text-success" : "text-ink"
              }`}
            >
              {isReflection ? (
                "✅ Saved"
              ) : correct ? (
                <>
                  ✅ {praise(index)} <StarReward count={score} />
                </>
              ) : (
                `🔁 ${nudge(index)}`
              )}
            </motion.span>
          )}
        </AnimatePresence>
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
