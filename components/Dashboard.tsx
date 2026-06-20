"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Session } from "@/lib/session";
import { useProfile } from "@/lib/useProfile";
import { useProgress } from "@/lib/useProgress";
import { buildCalendar, deriveStats } from "@/lib/progress";
import LogoutButton from "@/components/LogoutButton";
import ThemeToggle from "@/components/ThemeToggle";
import UserProfileCard from "@/components/UserProfileCard";
import StreakCard from "@/components/StreakCard";
import ProgressCard from "@/components/ProgressCard";
import ProgressBar from "@/components/ProgressBar";
import TodayLessonCard from "@/components/TodayLessonCard";
import LearningCalendar from "@/components/LearningCalendar";
import ExportDataButton from "@/components/ExportDataButton";

export default function Dashboard({ session }: { session: Session }) {
  const router = useRouter();
  const profile = useProfile(session.email);
  const progress = useProgress(session.email);

  // Signed in but not onboarded yet → finish onboarding first.
  useEffect(() => {
    if (profile === null) router.replace("/onboarding");
  }, [profile, router]);

  if (!profile) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-16 text-ink-soft">
        Loading your quest…
      </div>
    );
  }

  const stats = deriveStats(progress);
  const calendar = buildCalendar(progress);
  const today = calendar.find((d) => d.status === "current") ?? null;

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-5 py-8 sm:px-6">
      <header className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-lg font-bold text-ink">
          <span aria-hidden>🎓</span> English&nbsp;Quest
        </span>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LogoutButton />
        </div>
      </header>

      <div className="mt-6 flex flex-col gap-5">
        {/* Compact greeting — personal, but doesn't bury the quest. */}
        <UserProfileCard profile={profile} />

        {/* HERO — the single most important thing to do today. */}
        <TodayLessonCard day={today} />

        {/* Streak — sits right under the quest to nudge the daily habit. */}
        <StreakCard streak={stats.currentStreak} hasQuestToday={today !== null} />

        {/* Supporting stats (secondary to the quest above). */}
        <section>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink-soft">
            Your progress
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <ProgressCard icon="📚" value={stats.completedCount} label="Lessons done" />
            <ProgressCard
              icon="⭐"
              value={stats.totalStars}
              label="Stars earned"
              accent="text-amber"
            />
            <ProgressCard
              icon="📈"
              value={`${stats.completionPercent}%`}
              label="Completion"
            />
          </div>
          <div className="eq-card mt-3 p-5">
            <div className="flex items-center justify-between text-sm font-medium text-ink-soft">
              <span>Overall progress</span>
              <span>{stats.completionPercent}%</span>
            </div>
            <div className="mt-2">
              <ProgressBar percent={stats.completionPercent} />
            </div>
          </div>
        </section>

        <LearningCalendar days={calendar} />

        {/* Data safety net — everything lives only on this device. */}
        <footer className="mt-2 flex flex-col items-center gap-2 border-t border-ink/10 pt-6 text-center">
          <ExportDataButton email={session.email} />
          <p className="text-xs text-ink-soft">
            Your profile and progress are saved only on this device. Export a
            backup any time.
          </p>
        </footer>
      </div>
    </div>
  );
}
