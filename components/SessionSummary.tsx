"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { Session } from "@/lib/session";
import { useProgress } from "@/lib/useProgress";
import { buildCalendar, deriveStats } from "@/lib/progress";
import { getLessonMeta } from "@/lib/lessons";
import { accuracyLabel, formatDuration } from "@/lib/statisticsEngine";
import ProgressCard from "@/components/ProgressCard";
import StarReward from "@/components/StarReward";

export default function SessionSummary({
  session,
  day,
}: {
  session: Session;
  day: number;
}) {
  const progress = useProgress(session.email);
  const result = progress[day];
  const meta = getLessonMeta(day);

  if (!result) {
    return (
      <div className="mx-auto w-full max-w-lg flex-1 px-6 py-16 text-center">
        <div className="eq-card p-8">
          <span className="text-4xl" aria-hidden>
            🤔
          </span>
          <h1 className="mt-3 text-2xl font-bold text-ink">
            No results for this lesson yet
          </h1>
          <p className="mt-2 text-ink-soft">
            Finish the lesson to see your session summary.
          </p>
          <Link href="/dashboard" className="eq-btn eq-btn-primary mt-6">
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  const stats = deriveStats(progress);
  const next = buildCalendar(progress).find((d) => d.status === "current");

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-5 py-10 text-center sm:px-6">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
      >
        <span className="text-5xl" aria-hidden>
          🎉
        </span>
        <h1 className="mt-3 text-3xl font-extrabold text-ink">Lesson complete!</h1>
        <p className="mt-1 text-ink-soft">
          {meta ? `Day ${day}: ${meta.topic}` : `Day ${day}`} ·{" "}
          {accuracyLabel(result.accuracy)}
        </p>
      </motion.div>

      <div className="mt-6 flex flex-col items-center">
        <StarReward count={Math.min(result.stars, 12)} />
        <p className="mt-1 text-lg font-bold text-amber">+{result.stars} stars</p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <ProgressCard icon="⏱" value={formatDuration(result.durationSec)} label="Time taken" />
        <ProgressCard icon="🎯" value={`${result.accuracy}%`} label="Accuracy" />
        <ProgressCard
          icon="✅"
          value={`${result.correct}/${result.total}`}
          label="Correct"
        />
        <ProgressCard
          icon="⭐"
          value={result.stars}
          label="Stars earned"
          accent="text-amber"
        />
      </div>

      <div className="eq-card mt-6 p-5 text-left">
        <p className="mb-3 text-sm font-bold text-ink">Your overall progress</p>
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-paper-2 p-4 text-center">
            <p className="text-xl font-extrabold text-ink">{stats.completedCount}</p>
            <p className="text-xs text-ink-soft">Lessons</p>
          </div>
          <div className="rounded-2xl bg-paper-2 p-4 text-center">
            <p className="text-xl font-extrabold text-amber">{stats.totalStars}</p>
            <p className="text-xs text-ink-soft">Total stars</p>
          </div>
          <div className="rounded-2xl bg-paper-2 p-4 text-center">
            <p className="text-xl font-extrabold text-ink">
              {stats.currentStreak} 🔥
            </p>
            <p className="text-xs text-ink-soft">Day streak</p>
          </div>
        </div>
      </div>

      <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
        {next && (
          <Link href={`/session/${next.meta.day}`} className="eq-btn eq-btn-primary">
            Next lesson →
          </Link>
        )}
        <Link href="/dashboard" className="eq-btn eq-btn-ghost">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
