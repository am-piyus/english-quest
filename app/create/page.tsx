"use client";

import RequireAuth from "@/components/RequireAuth";
import SessionBuilder from "@/components/builder/SessionBuilder";

export default function CreatePage() {
  return (
    <RequireAuth>
      {(session) => <SessionBuilder email={session.email} />}
    </RequireAuth>
  );
}
