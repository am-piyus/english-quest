"use client";

import { useSyncExternalStore } from "react";
import {
  getProgressSnapshot,
  subscribeProgress,
  type ProgressMap,
} from "@/lib/progress";

/** Reactive access to the current user's learning progress. */
export function useProgress(email: string): ProgressMap {
  return useSyncExternalStore(
    subscribeProgress,
    () => getProgressSnapshot(email),
    () => ({}),
  );
}
