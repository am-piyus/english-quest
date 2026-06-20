"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Assignment, Concept } from "@/types/lesson";
import type { AnswerResult, ResponseMap } from "@/types/question";
import { useSession } from "@/lib/useSession";
import { getFunnelName, setFunnelName } from "@/lib/funnelDraft";
import ThemeToggle from "@/components/ThemeToggle";
import ConceptCard from "@/components/ConceptCard";
import AssignmentBlock from "@/components/AssignmentBlock";
import FunnelLogin from "@/components/FunnelLogin";

/* ── The fixed sample lesson — a "taste" of the real session ──────────── */

const sampleConcept: Concept = {
  title: "Adding -s / -es (he, she, it)",
  explanation:
    "In the present tense, when the subject is he, she, or it, the verb takes an extra ending.\n\nMost verbs just add -s. Verbs ending in -ch, -sh, -ss, -x, or -o take -es so they're easy to say.",
  examples: [
    "She goes to school every morning.",
    "He watches TV after dinner.",
    "It works perfectly now.",
  ],
  note: "Only he / she / it (third-person singular) get the extra ending — I, you, we, they do not.",
};

const sampleAssignment: Assignment = {
  title: "Quick check",
  intro: "Two fast questions — just like every daily session.",
  questions: [
    {
      id: "sample-q1",
      type: "mcq",
      prompt: "Which sentence is correct?",
      options: ["She go to school.", "She goes to school."],
      answerIndex: 1,
      difficulty: "Easy",
      feedback: "Exactly — third-person singular adds -s: she goes.",
      hint: "Think about she / he / it.",
    },
    {
      id: "sample-q2",
      type: "fill-blank",
      prompt: "He ___ (watch) TV every night.",
      answer: "watches",
      alternates: ["watch's"],
      difficulty: "Easy",
      feedback: "Nice — 'watch' ends in -ch, so it takes -es → watches.",
      hint: "Verbs ending in -ch take -es.",
    },
  ],
};

/* ── Funnel ───────────────────────────────────────────────────────────── */

type Step = "welcome" | "name" | "why" | "sample" | "save";
const ORDER: Step[] = ["welcome", "name", "why", "sample", "save"];
const PREV: Record<Step, Step | null> = {
  welcome: null,
  name: "welcome",
  why: "name",
  sample: "why",
  save: "sample",
};

export default function WelcomeFunnel() {
  const router = useRouter();
  const session = useSession(); // undefined | null | Session
  const [step, setStep] = useState<Step>("welcome");
  const [name, setName] = useState(() => getFunnelName());
  const [responses, setResponses] = useState<ResponseMap>({});

  // Returning user → straight to the dashboard, never a flash of the funnel.
  useEffect(() => {
    if (session) router.replace("/dashboard");
  }, [session, router]);

  if (session === undefined || session) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-16 text-ink-soft">
        Loading…
      </div>
    );
  }

  const first = name.trim() || "there";

  function goName() {
    setFunnelName(name.trim());
    setStep("why");
  }

  function recordAnswer(r: AnswerResult) {
    setResponses((prev) => ({ ...prev, [r.questionId]: r }));
  }

  const stepIndex = ORDER.indexOf(step);
  const back = PREV[step];

  return (
    <div className="relative flex flex-1 items-center justify-center px-6 py-12">
      <ThemeToggle className="absolute right-4 top-4 z-30" />

      <div className={`w-full ${step === "sample" ? "max-w-2xl" : "max-w-md"}`}>
        <div className="mb-4 flex justify-center">
          <span className="flex items-center gap-2 text-base font-bold text-ink">
            <span aria-hidden>🎓</span> English&nbsp;Quest
          </span>
        </div>

        {/* Step context for screen readers; the dots are decorative. */}
        <p className="sr-only" aria-live="polite">
          Step {stepIndex + 1} of {ORDER.length}
        </p>
        <div className="flex justify-center gap-2" aria-hidden>
          {ORDER.map((_, i) => (
            <span
              key={i}
              className={`h-2 rounded-full transition-all ${
                i === stepIndex
                  ? "w-6 bg-brand"
                  : i < stepIndex
                    ? "w-2 bg-brand/50"
                    : "w-2 bg-ink/15"
              }`}
            />
          ))}
        </div>

        <div className={`mt-5 ${step === "sample" ? "" : "eq-card p-7 sm:p-8"}`}>
          {back && (
            <button
              type="button"
              onClick={() => setStep(back)}
              className="-ml-2 mb-3 inline-flex min-h-[44px] items-center px-2 text-sm font-semibold text-ink-soft hover:text-ink"
            >
              ← Back
            </button>
          )}

          {step === "welcome" && (
            <div className="text-center">
              <span className="eq-chip mb-4">🚀 Welcome to English Quest</span>
              <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">
                Practise real English — interactively.
              </h1>
              <p className="mt-3 text-ink-soft">
                No static PDFs. You&apos;ll read a tiny concept, try it yourself,
                and get instant feedback — on your phone or laptop.
              </p>
              <button
                type="button"
                onClick={() => setStep("name")}
                className="eq-btn eq-btn-primary mt-7 w-full"
              >
                Continue →
              </button>
            </div>
          )}

          {step === "name" && (
            <div>
              <h1 className="text-2xl font-bold text-ink">
                First, what should we call you?
              </h1>
              <p className="mt-1 text-sm text-ink-soft">
                Just your first name — no account yet.
              </p>
              <label htmlFor="funnelName" className="sr-only">
                Your first name
              </label>
              <input
                id="funnelName"
                type="text"
                autoFocus
                value={name}
                enterKeyHint="next"
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && name.trim()) goName();
                }}
                placeholder="Your name"
                className="mt-5 w-full rounded-2xl bg-surface px-4 py-3.5 text-base text-ink ring-1 ring-ink/10 outline-none focus:ring-2 focus:ring-brand"
              />
              <button
                type="button"
                onClick={goName}
                disabled={!name.trim()}
                className="eq-btn eq-btn-primary mt-6 w-full"
              >
                Continue →
              </button>
            </div>
          )}

          {step === "why" && (
            <div className="text-center">
              <h1 className="text-2xl font-bold text-ink">
                Here&apos;s how it works, {first}
              </h1>
              <ol className="mt-6 space-y-3 text-left">
                {[
                  ["📖", "Read a bite-sized concept"],
                  ["✏️", "Try a tiny assignment"],
                  ["⚡", "Get instant, friendly feedback"],
                ].map(([icon, label], i) => (
                  <li
                    key={label}
                    className="flex items-center gap-3 rounded-2xl bg-paper-2 px-4 py-3"
                  >
                    <span className="text-xl" aria-hidden>
                      {icon}
                    </span>
                    <span className="font-semibold text-ink">
                      {i + 1}. {label}
                    </span>
                  </li>
                ))}
              </ol>
              <button
                type="button"
                onClick={() => setStep("sample")}
                className="eq-btn eq-btn-primary mt-7 w-full"
              >
                Show me →
              </button>
            </div>
          )}

          {step === "sample" && (
            <div className="space-y-5">
              <div className="text-center">
                <span className="eq-chip">✨ A quick taste</span>
                <h1 className="mt-3 text-xl font-bold text-ink sm:text-2xl">
                  Try it yourself, {first}
                </h1>
              </div>
              <ConceptCard concept={sampleConcept} />
              <AssignmentBlock
                assignment={sampleAssignment}
                responses={responses}
                onAnswer={recordAnswer}
              />
              <p className="text-center font-semibold text-ink">
                That&apos;s exactly how every daily session works. 🎯
              </p>
              <button
                type="button"
                onClick={() => setStep("save")}
                className="eq-btn eq-btn-primary w-full"
              >
                Continue →
              </button>
            </div>
          )}

          {step === "save" && (
            <div>
              <span className="eq-chip mb-3">🎉 Nice work, {first}!</span>
              <h1 className="text-2xl font-bold text-ink">
                Save your progress
              </h1>
              <p className="mt-1 text-sm text-ink-soft">
                Sign in so your stars and streak are waiting when you come back
                tomorrow. It only takes a second.
              </p>
              <div className="mt-6">
                <FunnelLogin name={name} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
