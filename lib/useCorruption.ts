"use client";

import { useSyncExternalStore } from "react";
import {
  subscribeCorruption,
  getCorruptionSnapshot,
  getCorruptionServerSnapshot,
  type CorruptionNotice,
} from "@/lib/storage";

/** Reactive list of keys that failed validation and were reset on this device. */
export function useCorruption(): CorruptionNotice[] {
  return useSyncExternalStore(
    subscribeCorruption,
    getCorruptionSnapshot,
    getCorruptionServerSnapshot,
  );
}
