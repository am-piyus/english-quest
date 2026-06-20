"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { saveSession } from "@/lib/session";
import { getProfile, saveProfile } from "@/lib/userProfile";
import {
  googleEnabled,
  renderGoogleButton,
  type GoogleAuthError,
} from "@/lib/googleAuth";
import { clearFunnelName, getFunnelName } from "@/lib/funnelDraft";

type GoogleStatus = "connecting" | "ready" | "error";

/**
 * Sign-in for the END of the first-run funnel (Droplet 25.3.2.5). Unlike
 * LoginButton, it writes the PROFILE (with the funnel name + sensible defaults)
 * BEFORE navigating, so the dashboard never bounces the user to /onboarding —
 * the funnel fully replaces it. Framed as "save your progress", not a gate.
 */
export default function FunnelLogin({ name }: { name: string }) {
  const router = useRouter();
  const googleRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<GoogleStatus>(
    googleEnabled ? "connecting" : "ready",
  );
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const completeSignin = useCallback(
    (email: string, displayName: string, refreshProfile: boolean) => {
      const fullName =
        getFunnelName() || displayName.trim() || name.trim() || "Learner";
      // Demo is a shared throwaway account → always refresh its name so a repeat
      // visitor isn't greeted by the previous person's name. For a real (Google)
      // account, never clobber a returning user's existing profile/preferences.
      if (refreshProfile || getProfile(email) === null) {
        saveProfile(email, {
          fullName,
          level: "Beginner",
          goal: "Mixed Learning",
          dailyTargetMinutes: 20,
          createdAt: new Date().toISOString(),
        });
      }
      clearFunnelName();
      // Profile written first so the dashboard doesn't bounce to /onboarding
      // (holds whenever localStorage is writable).
      router.replace("/dashboard");
    },
    [router, name],
  );

  useEffect(() => {
    const el = googleRef.current;
    if (!googleEnabled || !el) return;
    let active = true;
    el.innerHTML = "";

    void renderGoogleButton(
      el,
      (profile) => {
        if (!active) return;
        saveSession({
          email: profile.email,
          name: profile.name, // keep the Google display name on the session
          picture: profile.picture,
          provider: "google",
        });
        completeSignin(profile.email, profile.name, false);
      },
      (authErr: GoogleAuthError) => {
        if (!active) return;
        setError(authErr.message);
        setStatus("error");
      },
    ).then(() => {
      if (active) setStatus((s) => (s === "error" ? s : "ready"));
    });

    return () => {
      active = false;
    };
  }, [completeSignin, attempt]);

  function retry() {
    setError(null);
    setStatus("connecting");
    setAttempt((n) => n + 1);
  }

  function startDemo() {
    const email = "demo@englishquest.app";
    const fullName = getFunnelName() || name.trim() || "Learner";
    // Note: saveSession directly (not signInDemo, which would overwrite the name).
    saveSession({ email, name: fullName, provider: "demo" });
    completeSignin(email, fullName, true);
  }

  return (
    <div className="flex flex-col gap-3">
      {googleEnabled && (
        <div className="flex flex-col items-center gap-2">
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
          <span className="h-px flex-1 bg-ink/10" />
          or
          <span className="h-px flex-1 bg-ink/10" />
        </div>
      )}

      <button
        type="button"
        onClick={startDemo}
        className="eq-btn eq-btn-primary w-full"
      >
        Save my progress & start
      </button>
    </div>
  );
}
