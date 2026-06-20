"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { Lesson } from "@/types/lesson";
import type { AnswerResult, ResponseMap } from "@/types/question";
import RequireAuth from "@/components/RequireAuth";
import LessonHeader from "@/components/LessonHeader";
import ConceptCard from "@/components/ConceptCard";
import AssignmentBlock from "@/components/AssignmentBlock";
import SessionProgress from "@/components/SessionProgress";
import LessonNavigator from "@/components/LessonNavigator";
import AchievementPopup from "@/components/AchievementPopup";

export default function SessionScreen({
  day,
  lesson,
}: {
  day: number;
  lesson: Lesson | null;
}) {
  return (
    <RequireAuth>{() => <SessionRunner day={day} lesson={lesson} />}</RequireAuth>
  );
}

function SessionRunner({ day, lesson }: { day: number; lesson: Lesson | null }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [responses, setResponses] = useState<ResponseMap>({});

  function recordAnswer(result: AnswerResult) {
    setResponses((prev) => ({ ...prev, [result.questionId]: result }));
  }

  if (!lesson) {
    return (
      <div className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
        <Link
          href="/dashboard"
          className="text-sm font-semibold text-brand-dark hover:underline"
        >
          ← Back to dashboard
        </Link>
        <div className="eq-card mt-6 p-8 text-center">
          <span className="text-4xl" aria-hidden>
            📝
          </span>
          <h1 className="mt-4 text-2xl font-bold text-ink">
            Day {day} lesson coming soon
          </h1>
          <p className="mt-2 text-ink-soft">
            This day&apos;s content hasn&apos;t been added yet. Lessons are added
            as simple JSON files in <code>data/</code> — see the content authoring
            guide.
          </p>
        </div>
      </div>
    );
  }

  // Step 0 is the intro/header; steps 1..N are the lesson sections.
  const totalSteps = lesson.sections.length + 1;
  const isIntro = step === 0;
  const isLast = step === totalSteps - 1;
  const section = isIntro ? null : lesson.sections[step - 1];

  // On an assignment, require every gradable question to be attempted first.
  const gradable =
    section?.kind === "assignment"
      ? section.assignment.questions.filter((q) => q.type !== "reflection")
      : [];
  const allAnswered = gradable.every((q) => Boolean(responses[q.id]));
  const assignmentPerfect =
    gradable.length > 0 && gradable.every((q) => responses[q.id]?.correct);

  const sessionStars = Object.values(responses).reduce(
    (sum, r) => sum + r.score,
    0,
  );

  function goTo(nextStep: number) {
    setStep(nextStep);
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  }

  function next() {
    if (isLast) {
      // Droplet 25.3.1.7 will route to /session-complete with the results.
      router.push("/dashboard");
      return;
    }
    goTo(Math.min(step + 1, totalSteps - 1));
  }

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-5 py-8 sm:px-6">
      <AchievementPopup
        show={assignmentPerfect}
        title="Perfect! 🎉"
        detail="Every answer correct"
      />

      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="text-sm font-semibold text-brand-dark hover:underline"
        >
          ← Exit
        </Link>
        <div className="flex items-center gap-3 text-sm font-medium text-ink-soft">
          <span>{lesson.topic}</span>
          <motion.span
            key={sessionStars}
            initial={{ scale: 1.4 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-1 font-bold text-amber"
          >
            ⭐ {sessionStars}
          </motion.span>
        </div>
      </div>

      <div className="mt-4">
        <SessionProgress current={step} total={totalSteps} />
      </div>

      <div className="mt-6">
        {isIntro && <LessonHeader lesson={lesson} />}
        {section?.kind === "concept" && <ConceptCard concept={section.concept} />}
        {section?.kind === "assignment" && (
          <AssignmentBlock
            assignment={section.assignment}
            responses={responses}
            onAnswer={recordAnswer}
          />
        )}
      </div>

      {section?.kind === "assignment" && !allAnswered && (
        <p className="mt-4 text-center text-sm text-ink-soft">
          Answer every question to continue.
        </p>
      )}

      <div className="mt-4">
        <LessonNavigator
          onBack={() => goTo(Math.max(step - 1, 0))}
          onNext={next}
          backDisabled={step === 0}
          nextDisabled={section?.kind === "assignment" && !allAnswered}
          nextLabel={isIntro ? "Start lesson →" : isLast ? "Finish" : "Next →"}
        />
      </div>
    </div>
  );
}
