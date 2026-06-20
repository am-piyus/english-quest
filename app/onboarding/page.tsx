"use client";

import RequireAuth from "@/components/RequireAuth";
import OnboardingForm from "@/components/OnboardingForm";
import ThemeToggle from "@/components/ThemeToggle";

export default function OnboardingPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-12">
      <ThemeToggle className="fixed right-4 top-4 z-50" />
      <RequireAuth>
        {(session) => <OnboardingForm session={session} />}
      </RequireAuth>
    </div>
  );
}
