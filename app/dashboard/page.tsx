"use client";

import RequireAuth from "@/components/RequireAuth";
import DashboardGate from "@/components/DashboardGate";

export default function DashboardPage() {
  return (
    <RequireAuth>{(session) => <DashboardGate session={session} />}</RequireAuth>
  );
}
