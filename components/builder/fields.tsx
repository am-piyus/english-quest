"use client";

import type { ReactNode } from "react";

/**
 * Small shared field primitives for the session builder (Droplet 25.3.3.4) so
 * every editor styles its inputs the same way. Presentation only — no logic.
 */

export const fieldClass =
  "w-full rounded-xl bg-surface px-3 py-2.5 text-base text-ink ring-1 ring-ink/10 outline-none focus:ring-2 focus:ring-brand";

export function Labeled({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-ink">{label}</span>
      {children}
    </label>
  );
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <Labeled label={label}>
      <input
        className={fieldClass}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </Labeled>
  );
}

export function TextArea({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <Labeled label={label}>
      <textarea
        rows={rows}
        className={fieldClass}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </Labeled>
  );
}

/** Split a multi-line textarea value into trimmed, non-empty lines. */
export function splitLines(v: string): string[] {
  return v
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}
