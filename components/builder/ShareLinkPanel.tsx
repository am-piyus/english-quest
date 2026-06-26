"use client";

import { useState } from "react";
import type { Lesson } from "@/types/lesson";
import { encode, shareUrl } from "@/lib/shareLink";
import { validateLesson } from "@/lib/contentParser";

/**
 * Generate a copyable share link for a session (Droplet 25.3.3.4; wired further
 * in 25.3.3.7; re-shareable from the saved list in 25.3.3.9). Validates first
 * (the single gate), then encodes to <basePath>/play#s=<code> and warns — rather
 * than emitting a broken link — if the URL is unusually large.
 *
 * A share link is a self-contained SNAPSHOT (the whole session is in the URL,
 * there's no backend), so the panel says so honestly: editing later doesn't
 * change links already sent — you generate a fresh one. With `auto`, the link is
 * produced on mount (used by the "Share" action on a saved session).
 */

type LinkResult = {
  link: string | null;
  warning: string | null;
  error: string | null;
};
const EMPTY: LinkResult = { link: null, warning: null, error: null };

function computeLink(lesson: Lesson): LinkResult {
  const errs = validateLesson(lesson);
  if (errs.length > 0) {
    return {
      link: null,
      warning: null,
      error: "Finish the session before sharing — " + errs[0],
    };
  }
  const url = shareUrl(encode(lesson));
  return {
    link: url,
    warning:
      url.length > 8000
        ? "This session is large; very long links don't work everywhere. Consider trimming the content."
        : null,
    error: null,
  };
}

export default function ShareLinkPanel({
  lesson,
  auto = false,
}: {
  lesson: Lesson;
  auto?: boolean;
}) {
  // `auto` rows compute the link once at mount; the manual button recomputes from
  // the latest session. Pure compute → no effect, no setState-in-effect.
  const [result, setResult] = useState<LinkResult>(() =>
    auto ? computeLink(lesson) : EMPTY,
  );
  const [copied, setCopied] = useState(false);
  const { link, warning, error } = result;

  function generate() {
    setCopied(false);
    setResult(computeLink(lesson));
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
      {!auto && (
        <button
          type="button"
          onClick={generate}
          className="eq-btn eq-btn-ghost w-full sm:w-auto"
        >
          🔗 Generate share link
        </button>
      )}

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
          <p className="text-xs text-ink-soft">
            This link is a snapshot of the session as it is right now. If you edit
            it later, generate a new link to share the update — anyone who already
            has this link keeps seeing this version.
          </p>
        </div>
      )}
    </div>
  );
}
