import ProgressBar from "@/components/ProgressBar";

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
      <div className="mt-1.5">
        <ProgressBar percent={percent} className="h-2" />
      </div>
    </div>
  );
}
