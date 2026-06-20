export default function StreakCard({ streak }: { streak: number }) {
  return (
    <div className="eq-card flex flex-col items-center justify-center gap-0.5 p-5 text-center">
      <span className="text-3xl" aria-hidden>
        🔥
      </span>
      <span className="text-2xl font-extrabold text-ink">{streak}</span>
      <span className="text-xs font-medium text-ink-soft">day streak</span>
    </div>
  );
}
