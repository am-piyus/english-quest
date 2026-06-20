export default function ProgressCard({
  icon,
  value,
  label,
  accent = "text-ink",
}: {
  icon: string;
  value: string | number;
  label: string;
  accent?: string;
}) {
  return (
    <div className="eq-card flex flex-col gap-0.5 p-5">
      <span className="text-2xl" aria-hidden>
        {icon}
      </span>
      <span className={`text-2xl font-extrabold ${accent}`}>{value}</span>
      <span className="text-xs font-medium text-ink-soft">{label}</span>
    </div>
  );
}
