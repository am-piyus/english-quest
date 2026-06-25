"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Lesson } from "@/types/lesson";
import { loadSession } from "@/lib/customSessions";
import SessionScreen from "@/components/SessionScreen";

/**
 * Source-agnostic player route (Droplet 25.3.3.3). A single static page that
 * reads the session from the URL — `#s=<code>` (shared link, hash is client-only
 * so the base path/routing isn't an issue) or `?local=<id>` (saved) — resolves
 * it via loadSession, and renders the SAME SessionScreen. The registry player at
 * /session/[day] is untouched.
 */

type PlayState =
  | { status: "loading" }
  | { status: "ready"; lesson: Lesson }
  | { status: "error"; message: string };

/** Resolve the session purely from the current URL (client-only). */
function resolveFromUrl(): PlayState {
  const hash = window.location.hash;
  const localId = new URLSearchParams(window.location.search).get("local");

  let lesson: Lesson | null = null;
  let context = "session";
  if (hash.startsWith("#s=")) {
    context = "shared link";
    lesson = loadSession({ kind: "shared", code: hash.slice(3) });
  } else if (localId) {
    context = "saved session";
    lesson = loadSession({ kind: "local", id: localId });
  } else {
    return {
      status: "error",
      message:
        "There's no session to play here. Open a shared link, or build one in the session creator.",
    };
  }

  if (!lesson) {
    return {
      status: "error",
      message: `This ${context} couldn't be opened — it may be incomplete, corrupt, or no longer available on this device.`,
    };
  }
  return { status: "ready", lesson };
}

export default function PlayPage() {
  const [state, setState] = useState<PlayState>({ status: "loading" });

  useEffect(() => {
    // URL is client-only → resolve after mount, in a microtask so we're not
    // setting state synchronously during the effect.
    let active = true;
    Promise.resolve().then(() => {
      if (active) setState(resolveFromUrl());
    });
    return () => {
      active = false;
    };
  }, []);

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

  return <SessionScreen day={state.lesson.day} lesson={state.lesson} />;
}
