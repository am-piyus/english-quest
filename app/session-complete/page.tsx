"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import RequireAuth from "@/components/RequireAuth";
import SessionSummary from "@/components/SessionSummary";

function SessionCompleteInner() {
  const params = useSearchParams();
  const day = Number(params.get("day") ?? "0");
  return (
    <RequireAuth>
      {(session) => <SessionSummary session={session} day={day} />}
    </RequireAuth>
  );
}

export default function SessionCompletePage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center px-6 py-16 text-ink-soft">
          Loading…
        </div>
      }
    >
      <SessionCompleteInner />
    </Suspense>
  );
}
