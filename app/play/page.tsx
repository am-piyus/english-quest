"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Lesson } from "@/types/lesson";
import { loadSession, type SessionSource } from "@/lib/customSessions";
import { useSession } from "@/lib/useSession";
import SessionScreen from "@/components/SessionScreen";

/**
 * Source-agnostic player route (Droplet 25.3.3.3). A single static page that
 * reads the session from the URL — `#s=<code>` (shared link, hash is client-only
 * so the base path/routing isn't an issue) or `?local=<id>` (saved) — resolves
 * it via loadSession, and renders the SAME SessionScreen. The registry player at
 * /session/[day] is untouched.
 *
 * A `local` session is per-user (Droplet 25.3.3.8), so it resolves against the
 * signed-in user's email. Shared/registry sources need no auth, so this route
 * stays open to non-signed-in friends opening a `#s=` link.
 */

type PlayState =
  | { status: "loading" }
  | { status: "ready"; lesson: Lesson; source: SessionSource }
  | { status: "error"; message: string };

/** Resolve the session from the current URL (client-only); `email` scopes a
 *  local session to its owner. */
function resolveFromUrl(email: string | null): PlayState {
  const hash = window.location.hash;
  const localId = new URLSearchParams(window.location.search).get("local");

  let source: SessionSource | null = null;
  let context = "session";
  if (hash.startsWith("#s=")) {
    source = { kind: "shared", code: hash.slice(3) };
    context = "shared link";
  } else if (localId) {
    source = { kind: "local", id: localId };
    context = "saved session";
  } else {
    return {
      status: "error",
      message:
        "There's no session to play here. Open a shared link, or build one in the session creator.",
    };
  }

  const lesson = loadSession(source, email ?? undefined);
  if (!lesson) {
    return {
      status: "error",
      message: `This ${context} couldn't be opened — it may be incomplete, corrupt, or no longer available on this device.`,
    };
  }
  return { status: "ready", lesson, source };
}

export default function PlayPage() {
  const [state, setState] = useState<PlayState>({ status: "loading" });
  const session = useSession(); // undefined until auth state is read on the client

  useEffect(() => {
    // Wait until the auth state is settled so a `local` session resolves against
    // the right owner (a `#s=` shared link doesn't need it, but the email is
    // cheap to thread through and keeps one resolve path).
    if (session === undefined) return;
    // URL is client-only → resolve after mount, in a microtask so we're not
    // setting state synchronously during the effect.
    let active = true;
    Promise.resolve().then(() => {
      if (active) setState(resolveFromUrl(session?.email ?? null));
    });
    return () => {
      active = false;
    };
  }, [session]);

  if (state.status === "loading") {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-16 text-ink-soft">
        Loading session…
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="eq-card w-full max-w-md p-8 text-center">
          <span className="text-4xl" aria-hidden>
            🧩
          </span>
          <h1 className="mt-4 text-2xl font-bold text-ink">
            Can&apos;t open this session
          </h1>
          <p className="mt-2 text-ink-soft">{state.message}</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/create" className="eq-btn eq-btn-primary">
              Build a session
            </Link>
            <Link href="/dashboard" className="eq-btn eq-btn-ghost">
              Go to dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SessionScreen
      day={state.lesson.day}
      lesson={state.lesson}
      source={state.source}
    />
  );
}
