import type { Lesson } from "@/types/lesson";

export default function LessonHeader({ lesson }: { lesson: Lesson }) {
  return (
    <section className="eq-card p-6 sm:p-8">
      <span className="eq-chip mb-3">
        Day {lesson.day} · {lesson.difficulty} · ⏱ {lesson.durationMin} min
      </span>
      <p className="text-sm font-semibold text-brand-dark">{lesson.topic}</p>
      <h1 className="mt-1 text-2xl font-extrabold text-ink sm:text-3xl">
        {lesson.title}
      </h1>
      {lesson.intro && <p className="mt-3 text-ink-soft">{lesson.intro}</p>}

      <div className="mt-5">
        <p className="text-sm font-bold text-ink">In this lesson you&apos;ll:</p>
        <ul className="mt-2 space-y-1.5">
          {lesson.objectives.map((o) => (
            <li key={o} className="flex gap-2 text-sm text-ink-soft">
              <span className="text-brand" aria-hidden>
                ✓
              </span>
              {o}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
