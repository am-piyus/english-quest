"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/useSession";
import type { Session } from "@/lib/session";

/**
 * Client-side route guard (the static-export replacement for server middleware).
 * Renders its children only for a signed-in user, passing the session down.
 * Unauthenticated visitors are redirected to /login.
 */
export default function RequireAuth({
  children,
}: {
  children: (session: Session) => React.ReactNode;
}) {
  const router = useRouter();
  const session = useSession();

  useEffect(() => {
    if (session === null) router.replace("/login");
  }, [session, router]);

  if (!session) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-16 text-ink-soft">
        Loading…
      </div>
    );
  }

  return <>{children(session)}</>;
}
