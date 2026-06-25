"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { Session } from "@/lib/session";
import { useProgress } from "@/lib/useProgress";
import {
  buildCalendar,
  deriveStats,
  getLoggedResult,
  type LoggedResult,
} from "@/lib/progress";
import { getLessonMeta } from "@/lib/lessons";
import { accuracyLabel, formatDuration } from "@/lib/statisticsEngine";
import ProgressCard from "@/components/ProgressCard";
import StarReward from "@/components/StarReward";

/**
 * Completion summary. Registry sessions read the day-keyed result (and show the
 * registry calendar's overall progress + next lesson); shared/local sessions
 * (Droplet 25.3.3.7) read their session-keyed logged result by `sid` and show a
 * simpler recap with a path back into the app.
 */
export default function SessionSummary({
  session,
  day,
  sid,
}: {
  session: Session;
  day: number | null;
  sid: string | null;
}) {
  const progress = useProgress(session.email);
  const [logged, setLogged] = useState<LoggedResult | null | undefined>(
    sid ? undefined : null,
  );

  useEffect(() => {
    if (!sid) return;
    // Logged result lives in localStorage → read after mount (in a microtask).
    let active = true;
    Promise.resolve().then(() => {
      if (active) setLogged(getLoggedResult(session.email, sid));
    });
    return () => {
      active = false;
    };
  }, [sid, session.email]);

  if (sid && logged === undefined) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-16 text-ink-soft">
        Loading…
      </div>
    );
  }

  const result = sid ? logged : day != null ? progress[day] : null;

  if (!result) {
    return (
      <div className="mx-auto w-full max-w-lg flex-1 px-6 py-16 text-center">
        <div className="eq-card p-8">
          <span className="text-4xl" aria-hidden>
            🤔
          </span>
          <h1 className="mt-3 text-2xl font-bold text-ink">
            No results for this session yet
          </h1>
          <p className="mt-2 text-ink-soft">
            Finish the session to see your summary.
          </p>
          <Link href="/dashboard" className="eq-btn eq-btn-primary mt-6">
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  const isRegistry = !sid;
  const meta = day != null ? getLessonMeta(day) : null;
  const headerText = sid
    ? (result as LoggedResult).title || "Session complete"
    : meta
      ? `Day ${day}: ${meta.topic}`
      : `Day ${day}`;

  const stats = isRegistry ? deriveStats(progress) : null;
  const next = isRegistry
    ? buildCalendar(progress).find((d) => d.status === "current")
    : null;

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
        <h1 className="mt-3 text-3xl font-extrabold text-ink">
          Session complete!
        </h1>
        <p className="mt-1 text-ink-soft">
          {headerText} · {accuracyLabel(result.accuracy)}
        </p>
      </motion.div>

      <div className="mt-6 flex flex-col items-center">
        <StarReward count={Math.min(result.stars, 12)} />
        <p className="mt-1 text-lg font-bold text-amber">+{result.stars} stars</p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <ProgressCard
          icon="⏱"
          value={formatDuration(result.durationSec)}
          label="Time taken"
        />
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

      {isRegistry && stats && (
        <div className="eq-card mt-6 p-5 text-left">
          <p className="mb-3 text-sm font-bold text-ink">Your overall progress</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-paper-2 p-4 text-center">
              <p className="text-xl font-extrabold text-ink">
                {stats.completedCount}
              </p>
              <p className="text-xs text-ink-soft">Lessons</p>
            </div>
            <div className="rounded-2xl bg-paper-2 p-4 text-center">
              <p className="text-xl font-extrabold text-amber">
                {stats.totalStars}
              </p>
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
      )}

      <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
        {isRegistry && next && (
          <Link href={`/session/${next.meta.day}`} className="eq-btn eq-btn-primary">
            Next lesson →
          </Link>
        )}
        {!isRegistry && (
          <Link href="/create" className="eq-btn eq-btn-primary">
            Build another session
          </Link>
        )}
        <Link href="/dashboard" className="eq-btn eq-btn-ghost">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
