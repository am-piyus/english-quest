"use client";

import { useSyncExternalStore } from "react";
import {
  getProfileSnapshot,
  subscribeProfile,
  type UserProfile,
} from "@/lib/userProfile";

/**
 * Reads the current user's profile from localStorage reactively.
 *
 * Return value distinguishes three states:
 *   - `undefined` → not yet read on the client (SSR / first paint) → show loading
 *   - `null`      → read, but the user hasn't onboarded yet
 *   - UserProfile → read and found
 */
export function useProfile(email: string): UserProfile | null | undefined {
  return useSyncExternalStore(
    subscribeProfile,
    () => getProfileSnapshot(email),
    () => undefined,
  );
}
