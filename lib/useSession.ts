"use client";

import { useSyncExternalStore } from "react";
import {
  getSessionSnapshot,
  subscribeSession,
  type Session,
} from "@/lib/session";

/**
 * Reactive access to the signed-in user.
 *   - `undefined` → not yet read on the client (SSR / first paint) → show loading
 *   - `null`      → read, and nobody is signed in
 *   - Session     → signed in
 */
export function useSession(): Session | null | undefined {
  return useSyncExternalStore(
    subscribeSession,
    getSessionSnapshot,
    () => undefined,
  );
}
