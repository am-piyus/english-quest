import Link from "next/link";
import type { CalendarDay } from "@/lib/progress";

export default function TodayLessonCard({ day }: { day: CalendarDay | null }) {
  if (!day) {
    return (
      <section className="eq-card p-6 shadow-md ring-brand/30 sm:p-8">
        <span className="eq-chip mb-3">🎉 All caught up</span>
        <h2 className="text-xl font-bold text-ink">
          You&apos;ve completed every lesson available!
        </h2>
        <p className="mt-1 text-ink-soft">
          New quests are on the way — check back soon.
        </p>
      </section>
    );
  }

  const m = day.meta;

  return (
    <section className="eq-card p-6 shadow-md ring-brand/30 sm:p-8">
      <span className="eq-chip mb-3">📌 Today&apos;s quest</span>
      <p className="text-sm font-semibold text-brand-dark">
        Day {m.day} · {m.topic}
      </p>
      <h2 className="mt-1 text-2xl font-bold text-ink">{m.title}</h2>
      <p className="mt-1 text-ink-soft">{m.summary}</p>

      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        <span className="rounded-full bg-paper-2 px-3 py-1 text-ink-soft">
          ⏱ {m.durationMin} min
        </span>
        <span className="rounded-full bg-paper-2 px-3 py-1 text-ink-soft">
          📊 {m.difficulty}
        </span>
      </div>

      <Link
        href={`/session/${m.day}`}
        className="eq-btn eq-btn-primary mt-6 w-full sm:w-auto"
      >
        Continue learning →
      </Link>
    </section>
  );
}
