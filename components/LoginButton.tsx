"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { saveSession, signInDemo } from "@/lib/session";
import {
  googleEnabled,
  renderGoogleButton,
  type GoogleAuthError,
} from "@/lib/googleAuth";

type GoogleStatus = "connecting" | "ready" | "error";

export default function LoginButton() {
  const router = useRouter();
  const googleRef = useRef<HTMLDivElement>(null);
  // Only show the "connecting" state when Google is actually configured.
  const [status, setStatus] = useState<GoogleStatus>(
    googleEnabled ? "connecting" : "ready",
  );
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0); // bump to re-run the GIS init

  useEffect(() => {
    const el = googleRef.current;
    if (!googleEnabled || !el) return;
    let active = true;

    // Clear the container so a retry re-renders the Google button cleanly.
    el.innerHTML = "";

    void renderGoogleButton(
      el,
      (profile) => {
        if (!active) return;
        saveSession({
          email: profile.email,
          name: profile.name,
          picture: profile.picture,
          provider: "google",
        });
        router.push("/dashboard");
      },
      (authErr: GoogleAuthError) => {
        // Surface the failure — never swallow it (Droplet 25.3.2.1).
        if (!active) return;
        setError(authErr.message);
        setStatus("error");
      },
    ).then(() => {
      // Mark ready only if nothing reported an error during init.
      if (active) setStatus((s) => (s === "error" ? s : "ready"));
    });

    return () => {
      active = false;
    };
  }, [router, attempt]);

  function retry() {
    setError(null);
    setStatus("connecting");
    setAttempt((n) => n + 1);
  }

  function startDemo() {
    signInDemo();
    router.push("/dashboard");
  }

  return (
    <div className="flex flex-col gap-3">
      {googleEnabled && (
        <div className="flex flex-col items-center gap-2">
          {/* GIS renders its official button here. min-height avoids layout jump. */}
          <div ref={googleRef} className="flex min-h-[44px] justify-center" />

          {status === "connecting" && (
            <p className="text-xs text-ink-soft" role="status">
              Connecting to Google…
            </p>
          )}

          {status === "error" && error && (
            <div
              className="w-full rounded-xl border border-danger/40 bg-danger-soft px-3 py-2 text-center"
              role="alert"
            >
              <p className="text-sm text-danger">{error}</p>
              <button
                type="button"
                onClick={retry}
                className="mt-1 text-xs font-semibold text-brand-dark hover:underline"
              >
                Try again
              </button>
            </div>
          )}
        </div>
      )}

      {googleEnabled && (
        <div className="flex items-center gap-3 text-xs text-ink-soft">
          <span className="h-px flex-1 bg-black/10" />
          or
          <span className="h-px flex-1 bg-black/10" />
        </div>
      )}

      <button
        type="button"
        onClick={startDemo}
        className="eq-btn eq-btn-primary w-full"
      >
        Try the demo — no signup
      </button>
    </div>
  );
}
