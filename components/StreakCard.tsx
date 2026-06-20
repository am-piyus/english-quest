/**
 * Streak strip (Droplet 25.3.2.4) — placed right under today's quest as the
 * "don't break the chain" hook. Full-width and motivating rather than a small
 * stat tile. Adapts its copy when there's no quest left to do today.
 */
export default function StreakCard({
  streak,
  hasQuestToday,
}: {
  streak: number;
  hasQuestToday: boolean;
}) {
  const active = streak > 0;
  const title = active ? `${streak}-day streak` : "Start your streak";
  const subtitle = !hasQuestToday
    ? active
      ? "You've finished everything available — come back tomorrow to keep it going."
      : "New quests are on the way — check back soon."
    : active
      ? "Don't break the chain — finish today's quest to keep it alive."
      : "Finish today's quest to begin your streak.";

  return (
    <div className="eq-card flex items-center gap-4 p-5">
      <span
        className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-amber-soft text-2xl"
        aria-hidden
      >
        🔥
      </span>
      <div className="min-w-0">
        <p className="text-lg font-extrabold text-ink">{title}</p>
        <p className="text-sm text-ink-soft">{subtitle}</p>
      </div>
    </div>
  );
}
