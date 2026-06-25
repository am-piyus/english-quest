"use client";

import type { Assignment, Question } from "@/types/lesson";
import { TextField, TextArea, splitLines } from "@/components/builder/fields";
import OptionBankEditor from "@/components/builder/blockEditors/OptionBankEditor";

/**
 * Assignment editor (Droplet 25.3.3.4) — hosts the question types. Extend by
 * adding a kind to QUESTION_KINDS + a `newQuestion` case + a `QuestionEditor`
 * branch (option-bank plugs in here in 25.3.3.5).
 */

const QUESTION_KINDS = [
  { type: "mcq", label: "+ Multiple choice" },
  { type: "fill-blank", label: "+ Short answer" },
  { type: "option-bank", label: "+ Option bank" },
  { type: "reflection", label: "+ Reflection" },
] as const;

type NewType = (typeof QUESTION_KINDS)[number]["type"];

function rid(): string {
  return "q_" + Math.random().toString(36).slice(2, 9);
}

function newQuestion(type: NewType): Question {
  const id = rid();
  if (type === "mcq") {
    return { id, type: "mcq", prompt: "", options: ["", ""], answerIndex: 0 };
  }
  if (type === "fill-blank") {
    return { id, type: "fill-blank", prompt: "", answer: "" };
  }
  if (type === "option-bank") {
    return {
      id,
      type: "option-bank",
      prompt: "",
      options: ["", ""],
      items: [{ text: "", answer: 0 }],
    };
  }
  return { id, type: "reflection", prompt: "" };
}

function QuestionEditor({
  question,
  index,
  onChange,
  onDelete,
}: {
  question: Question;
  index: number;
  onChange: (q: Question) => void;
  onDelete: () => void;
}) {
  return (
    <div className="space-y-3 rounded-2xl bg-paper-2 p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wide text-ink-soft">
          Q{index + 1} · {question.type}
        </span>
        <button
          type="button"
          onClick={onDelete}
          className="text-xs font-semibold text-danger hover:underline"
        >
          Remove
        </button>
      </div>

      <TextField
        label={question.type === "option-bank" ? "Prompt (optional)" : "Prompt"}
        value={question.prompt ?? ""}
        onChange={(prompt) => onChange({ ...question, prompt })}
        placeholder="Ask the question…"
      />

      {(question.type === "mcq" || question.type === "case") && (
        <div className="space-y-2">
          <span className="block text-sm font-semibold text-ink">
            Options (tap the circle to mark the correct one)
          </span>
          {question.options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="radio"
                name={`correct-${question.id}`}
                checked={question.answerIndex === i}
                onChange={() => onChange({ ...question, answerIndex: i })}
                aria-label={`Mark option ${i + 1} correct`}
              />
              <input
                className="w-full rounded-xl bg-surface px-3 py-2 text-base text-ink ring-1 ring-ink/10 outline-none focus:ring-2 focus:ring-brand"
                value={opt}
                placeholder={`Option ${i + 1}`}
                onChange={(e) => {
                  const options = [...question.options];
                  options[i] = e.target.value;
                  onChange({ ...question, options });
                }}
              />
              {question.options.length > 2 && (
                <button
                  type="button"
                  onClick={() => {
                    const options = question.options.filter((_, idx) => idx !== i);
                    const answerIndex = Math.min(
                      question.answerIndex,
                      options.length - 1,
                    );
                    onChange({ ...question, options, answerIndex });
                  }}
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
            onClick={() =>
              onChange({ ...question, options: [...question.options, ""] })
            }
            className="text-sm font-semibold text-brand-dark hover:underline"
          >
            + Add option
          </button>
        </div>
      )}

      {(question.type === "fill-blank" || question.type === "structure") && (
        <>
          <TextField
            label="Answer"
            value={question.answer}
            onChange={(answer) => onChange({ ...question, answer })}
            placeholder="The correct answer"
          />
          <TextArea
            label="Also accept (one per line, optional)"
            value={(question.alternates ?? []).join("\n")}
            onChange={(v) => onChange({ ...question, alternates: splitLines(v) })}
            placeholder={"goes\ngoes."}
          />
        </>
      )}

      {question.type === "option-bank" && (
        <OptionBankEditor value={question} onChange={onChange} />
      )}

      {/* Optional coaching, shared by graded question types. */}
      {question.type !== "reflection" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField
            label="Hint (optional)"
            value={question.hint ?? ""}
            onChange={(hint) => onChange({ ...question, hint } as Question)}
            placeholder="Shown after a wrong attempt"
          />
          <TextField
            label="Feedback (optional)"
            value={
              "feedback" in question ? (question.feedback ?? "") : ""
            }
            onChange={(feedback) =>
              onChange({ ...question, feedback } as Question)
            }
            placeholder="Shown after a correct answer"
          />
        </div>
      )}
    </div>
  );
}

export default function AssignmentEditor({
  value,
  onChange,
}: {
  value: Assignment;
  onChange: (a: Assignment) => void;
}) {
  function setQuestions(questions: Question[]) {
    onChange({ ...value, questions });
  }

  return (
    <div className="space-y-3">
      <TextField
        label="Assignment title"
        value={value.title}
        onChange={(title) => onChange({ ...value, title })}
        placeholder="Practice"
      />
      <TextField
        label="Intro (optional)"
        value={value.intro ?? ""}
        onChange={(intro) => onChange({ ...value, intro })}
        placeholder="A line before the questions"
      />

      {/* A plain heading — NOT a <label> — so the per-question fields keep their
          own label association (no nested labels). */}
      <div>
        <p className="mb-1 text-sm font-semibold text-ink">
          Questions ({value.questions.length})
        </p>
        <div className="space-y-3">
          {value.questions.map((q, i) => (
            <QuestionEditor
              key={q.id}
              question={q}
              index={i}
              onChange={(nq) =>
                setQuestions(value.questions.map((x, idx) => (idx === i ? nq : x)))
              }
              onDelete={() =>
                setQuestions(value.questions.filter((_, idx) => idx !== i))
              }
            />
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {QUESTION_KINDS.map((k) => (
          <button
            key={k.type}
            type="button"
            onClick={() => setQuestions([...value.questions, newQuestion(k.type)])}
            className="rounded-full bg-brand-soft px-3 py-1.5 text-sm font-semibold text-brand-dark hover:brightness-105"
          >
            {k.label}
          </button>
        ))}
      </div>
    </div>
  );
}
