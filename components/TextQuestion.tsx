"use client";

export default function TextQuestion({
  value,
  onChange,
  disabled,
  multiline,
  placeholder = "Type your answer…",
  onSubmit,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  multiline?: boolean;
  placeholder?: string;
  onSubmit?: () => void;
}) {
  // text-base = 16px keeps iOS from zooming (and hiding the field) on focus.
  const className =
    "w-full rounded-2xl bg-surface px-4 py-3.5 text-base text-ink ring-1 ring-ink/10 outline-none focus:ring-2 focus:ring-brand disabled:opacity-70";

  if (multiline) {
    return (
      <textarea
        value={value}
        rows={3}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={className}
      />
    );
  }

  return (
    <input
      type="text"
      value={value}
      disabled={disabled}
      enterKeyHint="done"
      autoComplete="off"
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter" && onSubmit) {
          e.preventDefault();
          onSubmit();
        }
      }}
      placeholder={placeholder}
      className={className}
    />
  );
}
