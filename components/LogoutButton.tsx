"use client";

import { useRouter } from "next/navigation";
import { signOut } from "@/lib/session";

export default function LogoutButton({
  className = "eq-btn eq-btn-ghost",
}: {
  className?: string;
}) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => {
        signOut();
        router.push("/");
      }}
      className={className}
    >
      Sign out
    </button>
  );
}
