"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Session } from "@/lib/session";
import { useProfile } from "@/lib/useProfile";
import { useProgress } from "@/lib/useProgress";
import { buildCalendar, deriveStats } from "@/lib/progress";
import LogoutButton from "@/components/LogoutButton";
import UserProfileCard from "@/components/UserProfileCard";
import StreakCard from "@/components/StreakCard";
import ProgressCard from "@/components/ProgressCard";
import TodayLessonCard from "@/components/TodayLessonCard";
import LearningCalendar from "@/components/LearningCalendar";

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
        <LogoutButton />
      </header>

      <div className="mt-6 flex flex-col gap-6">
        <UserProfileCard profile={profile} />

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
          <StreakCard streak={stats.currentStreak} />
        </div>

        {/* Overall completion bar */}
        <div className="eq-card p-5">
          <div className="flex items-center justify-between text-sm font-medium text-ink-soft">
            <span>Overall progress</span>
            <span>{stats.completionPercent}%</span>
          </div>
          <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-paper-2">
            <div
              className="h-full rounded-full bg-brand transition-all"
              style={{ width: `${stats.completionPercent}%` }}
            />
          </div>
        </div>

        <TodayLessonCard day={today} />
        <LearningCalendar days={calendar} />
      </div>
    </div>
  );
}
