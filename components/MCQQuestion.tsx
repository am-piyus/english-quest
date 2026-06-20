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
    <div className="grid gap-2.5">
      {options.map((opt, i) => {
        const isSelected = selected === String(i);
        const isCorrect = showResult && i === correctIndex;
        const isWrongPick = showResult && isSelected && i !== correctIndex;

        // Supportive states: the right answer lights up green; a wrong pick is
        // gently de-emphasised (never a harsh red) so it reads as "try again".
        let cls = "bg-surface text-ink ring-ink/10 hover:bg-brand-soft";
        let icon = "";
        if (isCorrect) {
          cls = "bg-success-soft text-ink ring-2 ring-success/60";
          icon = "✓";
        } else if (isWrongPick) {
          cls = "bg-paper-2 text-ink-soft ring-2 ring-ink/25";
          icon = "↻";
        } else if (isSelected) {
          cls = "bg-brand text-white ring-brand";
        }

        return (
          <button
            key={i}
            type="button"
            disabled={locked}
            onClick={() => onSelect(String(i))}
            className={`flex min-h-[52px] items-center justify-between gap-3 rounded-2xl px-4 py-3.5 text-left text-base font-medium ring-1 transition disabled:cursor-not-allowed ${cls}`}
          >
            <span>{opt}</span>
            {/* State conveyed to assistive tech, not by colour/icon alone. */}
            {(isCorrect || isWrongPick) && (
              <span className="sr-only">
                {isCorrect ? " (correct answer)" : " (your answer — not correct)"}
              </span>
            )}
            {icon && (
              <span className="shrink-0 text-lg font-bold" aria-hidden>
                {icon}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
