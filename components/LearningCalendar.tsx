import Link from "next/link";
import type { CalendarDay } from "@/lib/progress";

function CalendarTile({ day }: { day: CalendarDay }) {
  const m = day.meta;
  const base = "flex flex-col gap-1 rounded-2xl p-4 ring-1 transition";

  if (day.status === "locked") {
    return (
      <div className={`${base} bg-paper-2 text-ink-soft ring-ink/10 opacity-70`}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold">Day {m.day}</span>
          <span aria-hidden>🔒</span>
        </div>
        <span className="text-sm font-semibold">{m.topic}</span>
      </div>
    );
  }

  const completed = day.status === "completed";

  return (
    <Link
      href={`/session/${m.day}`}
      className={`${base} ${
        completed
          ? "bg-success-soft ring-success/30 hover:ring-success/60"
          : "bg-brand-soft ring-brand/40 hover:ring-brand"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-ink">Day {m.day}</span>
        <span aria-hidden>{completed ? "✅" : "▶️"}</span>
      </div>
      <span className="text-sm font-semibold text-ink">{m.topic}</span>
      {completed && day.result ? (
        <span className="text-xs font-medium text-amber">
          ⭐ {day.result.stars}
        </span>
      ) : (
        <span className="text-xs font-medium text-brand-dark">Start now</span>
      )}
    </Link>
  );
}

export default function LearningCalendar({ days }: { days: CalendarDay[] }) {
  return (
    <section>
      <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink-soft">
        Your learning journey
      </h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {days.map((d) => (
          <CalendarTile key={d.meta.day} day={d} />
        ))}
      </div>
    </section>
  );
}
