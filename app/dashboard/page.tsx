"use client";

import RequireAuth from "@/components/RequireAuth";
import Dashboard from "@/components/Dashboard";

export default function DashboardPage() {
  return <RequireAuth>{(session) => <Dashboard session={session} />}</RequireAuth>;
}
