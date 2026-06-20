"use client";

import RequireAuth from "@/components/RequireAuth";
import OnboardingForm from "@/components/OnboardingForm";
import ThemeToggle from "@/components/ThemeToggle";

export default function OnboardingPage() {
  return (
    <div className="relative flex flex-1 items-center justify-center px-6 py-12">
      <ThemeToggle className="absolute right-4 top-4 z-30" />
      <RequireAuth>
        {(session) => <OnboardingForm session={session} />}
      </RequireAuth>
    </div>
  );
}
