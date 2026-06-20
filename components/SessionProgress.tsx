export default function SessionProgress({
  current,
  total,
}: {
  current: number; // 0-based step index
  total: number; // number of steps
}) {
  const percent = total <= 1 ? 0 : Math.round((current / (total - 1)) * 100);

  return (
    <div>
      <div className="flex items-center justify-between text-xs font-medium text-ink-soft">
        <span>
          Step {current + 1} of {total}
        </span>
        <span>{percent}%</span>
      </div>
      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-paper-2">
        <div
          className="h-full rounded-full bg-brand transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
