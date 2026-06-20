"use client";

export default function MCQQuestion({
  options,
  selected,
  onSelect,
  correctIndex,
  showResult,
  locked,
}: {
  options: string[];
  selected: string; // selected index as string ("" when none)
  onSelect: (value: string) => void;
  correctIndex: number;
  showResult: boolean;
  locked: boolean;
}) {
  return (
    <div className="grid gap-2">
      {options.map((opt, i) => {
        const isSelected = selected === String(i);
        let cls = "bg-surface text-ink ring-ink/10 hover:bg-brand-soft";
        if (showResult && i === correctIndex) {
          cls = "bg-success-soft text-ink ring-success/50";
        } else if (showResult && isSelected) {
          cls = "bg-danger-soft text-ink ring-danger/50";
        } else if (isSelected) {
          cls = "bg-brand text-white ring-brand";
        }
        return (
          <button
            key={i}
            type="button"
            disabled={locked}
            onClick={() => onSelect(String(i))}
            className={`rounded-2xl px-4 py-3 text-left text-sm font-medium ring-1 transition disabled:cursor-not-allowed ${cls}`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}
