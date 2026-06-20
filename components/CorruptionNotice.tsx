"use client";

import { dismissCorruption } from "@/lib/storage";
import { useCorruption } from "@/lib/useCorruption";

/**
 * Friendly banner shown when a localStorage key failed validation and was reset
 * (Droplet 25.3.2.2). Tells the user exactly what happened instead of silently
 * looking like a brand-new-user state. Only the affected key is reset; the rest
 * of their data is untouched.
 */
export default function CorruptionNotice() {
  const notices = useCorruption();
  if (notices.length === 0) return null;

  return (
    <div className="sticky top-0 z-40 flex flex-col">
      {notices.map((n) => (
        <div
          key={n.key}
          role="alert"
          className="flex items-center justify-between gap-3 border-b border-danger/30 bg-danger-soft px-4 py-2 text-sm text-danger"
        >
          <span>
            Some saved data ({n.label}) couldn&apos;t be read and was reset on
            this device. Your other data is safe.
          </span>
          <button
            type="button"
            onClick={() => dismissCorruption(n.key)}
            className="shrink-0 font-semibold underline"
          >
            Dismiss
          </button>
        </div>
      ))}
    </div>
  );
}
