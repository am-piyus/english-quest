"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/useSession";
import { googleEnabled } from "@/lib/googleAuth";
import LoginButton from "@/components/LoginButton";
import ThemeToggle from "@/components/ThemeToggle";

export default function LoginPage() {
  const router = useRouter();
  const session = useSession();

  // Already signed in? Head to the dashboard.
  useEffect(() => {
    if (session) router.replace("/dashboard");
  }, [session, router]);

  return (
    <div className="relative flex flex-1 items-center justify-center px-6 py-16">
      <ThemeToggle className="absolute right-4 top-4 z-30" />
      <div className="eq-card w-full max-w-md p-8 text-center">
        <span className="text-4xl" aria-hidden>
          🎓
        </span>
        <h1 className="mt-4 text-2xl font-bold text-ink">
          Sign in to English Quest
        </h1>
        <p className="mt-2 text-ink-soft">
          Pick up today&apos;s quest, earn stars, and keep your streak going.
        </p>

        <div className="mt-7 text-left">
          <LoginButton />
        </div>

        {!googleEnabled && (
          <p className="mt-4 text-xs text-ink-soft">
            Google sign-in activates automatically once a Google Client ID is
            configured. The demo login works right now.
          </p>
        )}

        <Link
          href="/"
          className="mt-6 inline-block text-sm font-semibold text-brand-dark hover:underline"
        >
          ← Back to home
        </Link>
      </div>
    </div>
  );
}
