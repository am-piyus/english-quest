"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/lib/useProfile";
import type { Session } from "@/lib/session";
import LogoutButton from "@/components/LogoutButton";

/**
 * Minimal authenticated dashboard for Droplet 25.3.1.2.
 *
 * It gates on whether the user has completed onboarding (no profile in
 * localStorage → redirect to /onboarding) and proves the end-to-end flow with a
 * personalized welcome + sign-out. Droplet 25.3.1.3 replaces the body with the
 * full gamified dashboard.
 */
export default function DashboardGate({ session }: { session: Session }) {
  const router = useRouter();
  const profile = useProfile(session.email);

  // Redirect (a side effect, not setState) once we know there's no profile.
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

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <header className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-lg font-bold text-ink">
          <span aria-hidden>🎓</span> English&nbsp;Quest
        </span>
        <LogoutButton />
      </header>

      <section className="eq-card mt-8 p-8">
        <span className="eq-chip mb-3">✅ You&apos;re signed in</span>
        <h1 className="text-3xl font-extrabold text-ink">
          Welcome, {profile.fullName.split(" ")[0]}!
        </h1>
        <p className="mt-2 text-ink-soft">
          Your dashboard with today&apos;s quest and progress calendar arrives in
          the next step. Here&apos;s the profile we&apos;ll personalize it with:
        </p>

        <dl className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-paper-2 p-4">
            <dt className="text-xs font-medium text-ink-soft">Level</dt>
            <dd className="mt-1 font-bold text-ink">{profile.level}</dd>
          </div>
          <div className="rounded-2xl bg-paper-2 p-4">
            <dt className="text-xs font-medium text-ink-soft">Goal</dt>
            <dd className="mt-1 font-bold text-ink">{profile.goal}</dd>
          </div>
          <div className="rounded-2xl bg-paper-2 p-4">
            <dt className="text-xs font-medium text-ink-soft">Daily target</dt>
            <dd className="mt-1 font-bold text-ink">
              {profile.dailyTargetMinutes} min
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
