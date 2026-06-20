"use client";

import RequireAuth from "@/components/RequireAuth";
import OnboardingForm from "@/components/OnboardingForm";

export default function OnboardingPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-12">
      <RequireAuth>
        {(session) => <OnboardingForm session={session} />}
      </RequireAuth>
    </div>
  );
}
