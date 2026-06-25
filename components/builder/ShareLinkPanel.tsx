"use client";

import { useState } from "react";
import type { Lesson } from "@/types/lesson";
import { encode, shareUrl } from "@/lib/shareLink";
import { validateLesson } from "@/lib/contentParser";

/**
 * Generate a copyable share link for the current session (Droplet 25.3.3.4;
 * wired further in 25.3.3.7). Validates first (the single gate), then encodes to
 * <basePath>/play#s=<code> and warns — rather than emitting a broken link — if
 * the URL is unusually large.
 */
export default function ShareLinkPanel({ lesson }: { lesson: Lesson }) {
  const [link, setLink] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function generate() {
    setCopied(false);
    const errs = validateLesson(lesson);
    if (errs.length > 0) {
      setError("Finish the session before sharing — " + errs[0]);
      setLink(null);
      setWarning(null);
      return;
    }
    setError(null);
    const url = shareUrl(encode(lesson));
    setLink(url);
    setWarning(
      url.length > 8000
        ? "This session is large; very long links don't work everywhere. Consider trimming the content."
        : null,
    );
  }

  async function copy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={generate}
        className="eq-btn eq-btn-ghost w-full sm:w-auto"
      >
        🔗 Generate share link
      </button>

      {error && <p className="text-sm text-danger">{error}</p>}

      {link && (
        <div className="space-y-2 rounded-2xl bg-paper-2 p-3">
          <p className="break-all text-xs text-ink-soft">{link}</p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={copy}
              className="eq-btn eq-btn-primary px-4 py-2.5 text-sm"
            >
              {copied ? "Copied ✓" : "Copy link"}
            </button>
            <a
              href={link}
              className="text-sm font-semibold text-brand-dark hover:underline"
            >
              Open
            </a>
          </div>
          {warning && (
            <p className="rounded-lg bg-amber-soft px-2 py-1 text-xs text-ink">
              ⚠️ {warning}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
