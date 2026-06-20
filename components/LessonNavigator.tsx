export default function LessonNavigator({
  onBack,
  onNext,
  backDisabled,
  nextLabel,
  nextDisabled,
}: {
  onBack: () => void;
  onNext: () => void;
  backDisabled?: boolean;
  nextLabel: string;
  nextDisabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <button
        type="button"
        onClick={onBack}
        disabled={backDisabled}
        className="eq-btn eq-btn-ghost"
      >
        ← Back
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={nextDisabled}
        className="eq-btn eq-btn-primary"
      >
        {nextLabel}
      </button>
    </div>
  );
}
