"use client";

import Link from "next/link";
import RequireAuth from "@/components/RequireAuth";
import { getLessonMeta } from "@/lib/lessons";

/**
 * Placeholder session screen for Droplet 25.3.1.3.
 * Droplet 25.3.1.4 replaces this with the real lesson + assignment engine.
 */
export default function SessionScreen({ day }: { day: number }) {
  const meta = getLessonMeta(day);

  return (
    <RequireAuth>
      {() => (
        <div className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
          <Link
            href="/dashboard"
            className="text-sm font-semibold text-brand-dark hover:underline"
          >
            ← Back to dashboard
          </Link>

          <div className="eq-card mt-6 p-8 text-center">
            <span className="text-4xl" aria-hidden>
              📚
            </span>
            <h1 className="mt-4 text-2xl font-bold text-ink">
              {meta ? `Day ${meta.day}: ${meta.topic}` : `Day ${day}`}
            </h1>
            <p className="mt-2 text-ink-soft">
              The interactive lesson engine arrives in the next step. Soon this is
              where you&apos;ll read concepts, study examples, and complete
              assignments with instant feedback.
            </p>
          </div>
        </div>
      )}
    </RequireAuth>
  );
}
