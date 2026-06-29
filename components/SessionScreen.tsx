"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { Lesson } from "@/types/lesson";
import type { AnswerResult, ResponseMap } from "@/types/question";
import type { Session } from "@/lib/session";
import { saveResult, logSessionResult } from "@/lib/progress";
import {
  buildSessionResult,
  buildLoggedResult,
  spellWordId,
} from "@/lib/sessionTracker";
import { spellRoundCount } from "@/lib/spellQuest";
import type { SessionSource } from "@/lib/customSessions";
import RequireAuth from "@/components/RequireAuth";
import LessonHeader from "@/components/LessonHeader";
import ConceptCard from "@/components/ConceptCard";
import RevisionBlock from "@/components/RevisionBlock";
import WordSearchBlock from "@/components/WordSearchBlock";
import SpellQuestBlock from "@/components/SpellQuestBlock";
import AssignmentBlock from "@/components/AssignmentBlock";
import SessionProgress from "@/components/SessionProgress";
import LessonNavigator from "@/components/LessonNavigator";
import AchievementPopup from "@/components/AchievementPopup";

export default function SessionScreen({
  day,
  lesson,
  source,
}: {
  day: number;
  lesson: Lesson | null;
  source?: SessionSource;
}) {
  return (
    <RequireAuth>
      {(session) => (
        <SessionRunner
          session={session}
          day={day}
          lesson={lesson}
          source={source}
        />
      )}
    </RequireAuth>
  );
}

function SessionRunner({
  session,
  day,
  lesson,
  source,
}: {
  session: Session;
  day: number;
  lesson: Lesson | null;
  source?: SessionSource;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [responses, setResponses] = useState<ResponseMap>({});
  const startedAt = useRef(0);

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

  // A graded block (assignment or spelling) must be fully attempted before moving
  // on. Both report per-unit results into `responses`, so gating is uniform.
  const requiredIds: string[] =
    section?.kind === "assignment"
      ? section.assignment.questions
          .filter((q) => q.type !== "reflection")
          .map((q) => q.id)
      : section?.kind === "spell"
        ? Array.from({ length: spellRoundCount(section.spell) }, (_, i) =>
            spellWordId(step - 1, i),
          )
        : [];
  const gatedBlock = section?.kind === "assignment" || section?.kind === "spell";
  const allAnswered = requiredIds.every((id) => Boolean(responses[id]));
  const assignmentPerfect =
    section?.kind === "assignment" &&
    requiredIds.length > 0 &&
    requiredIds.every((id) => responses[id]?.correct);

  const sessionStars = Object.values(responses).reduce(
    (sum, r) => sum + r.score,
    0,
  );

  function goTo(nextStep: number) {
    setStep(nextStep);
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  }

  function finish() {
    if (!lesson) return;
    const durationSec = startedAt.current
      ? Math.max(1, Math.round((Date.now() - startedAt.current) / 1000))
      : 0;
    const src: SessionSource = source ?? { kind: "registry", day };
    // Session-keyed log for every session type (a future dashboard reads this).
    const logged = buildLoggedResult(lesson, src, responses, durationSec);
    logSessionResult(session.email, logged);
    if (src.kind === "registry") {
      // The day-keyed result also powers the existing dashboard calendar/stats.
      saveResult(session.email, buildSessionResult(lesson, responses, durationSec));
      router.push(`/session-complete?day=${lesson.day}`);
    } else {
      router.push(`/session-complete?sid=${encodeURIComponent(logged.sessionId)}`);
    }
  }

  function next() {
    if (isIntro && startedAt.current === 0) startedAt.current = Date.now();
    if (isLast) {
      finish();
      return;
    }
    goTo(Math.min(step + 1, totalSteps - 1));
  }

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-5 pt-8 pb-24 sm:px-6">
      <AchievementPopup
        show={assignmentPerfect}
        title="Perfect! 🎉"
        detail="Every answer correct"
      />

      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="-ml-2 inline-flex min-h-[44px] items-center px-2 text-sm font-semibold text-brand-dark hover:underline"
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
        {section?.kind === "revision" && (
          <RevisionBlock revision={section.revision} />
        )}
        {section?.kind === "concept" && <ConceptCard concept={section.concept} />}
        {section?.kind === "wordsearch" && (
          <WordSearchBlock wordsearch={section.wordsearch} />
        )}
        {section?.kind === "spell" && (
          <SpellQuestBlock
            spell={section.spell}
            sectionIndex={step - 1}
            onAnswer={recordAnswer}
          />
        )}
        {section?.kind === "assignment" && (
          <AssignmentBlock
            assignment={section.assignment}
            assignmentNumber={
              lesson.sections
                .slice(0, step)
                .filter((s) => s.kind === "assignment").length
            }
            responses={responses}
            onAnswer={recordAnswer}
          />
        )}
      </div>

      {/* Thumb-reachable nav, pinned to the bottom of the viewport on phones. */}
      <div className="sticky bottom-0 z-20 mt-6 -mx-5 border-t border-ink/10 bg-paper/90 px-5 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        {gatedBlock && !allAnswered && (
          <p className="mb-2 text-center text-sm text-ink-soft">
            {section?.kind === "spell"
              ? "Finish the spelling round to continue — you can always try again. 🙂"
              : "Answer each question to continue — you can always try again. 🙂"}
          </p>
        )}
        <LessonNavigator
          onBack={() => goTo(Math.max(step - 1, 0))}
          onNext={next}
          backDisabled={step === 0}
          nextDisabled={gatedBlock && !allAnswered}
          nextLabel={isIntro ? "Start lesson →" : isLast ? "Finish 🎉" : "Next →"}
        />
      </div>
    </div>
  );
}
