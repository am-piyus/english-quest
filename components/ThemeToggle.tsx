"use client";

import { useTheme } from "@/lib/useTheme";

/**
 * Light/dark theme toggle (Droplet 25.3.2.3). 44px tap target, themed with
 * tokens so it reads correctly in both modes. The choice persists via the
 * theme store; the icon shows the mode you'll switch TO.
 */
export default function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      aria-pressed={isDark}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface text-xl text-ink ring-1 ring-ink/10 transition-colors hover:bg-ink/5 ${className}`}
    >
      <span aria-hidden>{isDark ? "☀️" : "🌙"}</span>
    </button>
  );
}
