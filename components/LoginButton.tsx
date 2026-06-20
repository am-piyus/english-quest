"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { saveSession, signInDemo } from "@/lib/session";
import { googleEnabled, renderGoogleButton } from "@/lib/googleAuth";

export default function LoginButton() {
  const router = useRouter();
  const googleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = googleRef.current;
    if (!googleEnabled || !el) return;
    let active = true;

    void renderGoogleButton(el, (profile) => {
      if (!active || !profile.email) return;
      saveSession({
        email: profile.email,
        name: profile.name,
        picture: profile.picture,
        provider: "google",
      });
      router.push("/dashboard");
    }).catch(() => {
      /* If GIS fails to load, the demo login still works. */
    });

    return () => {
      active = false;
    };
  }, [router]);

  return (
    <div className="flex flex-col gap-3">
      {googleEnabled && <div ref={googleRef} className="flex justify-center" />}

      <button
        type="button"
        onClick={() => {
          signInDemo();
          router.push("/dashboard");
        }}
        className="eq-btn eq-btn-primary w-full"
      >
        Try the demo — no signup
      </button>
    </div>
  );
}
