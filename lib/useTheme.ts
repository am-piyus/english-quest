"use client";

import { useSyncExternalStore } from "react";
import {
  subscribeTheme,
  getThemeSnapshot,
  getServerThemeSnapshot,
  toggleTheme,
  type Theme,
} from "@/lib/theme";

/** Reactive access to the current theme plus a one-call toggle. */
export function useTheme(): { theme: Theme; toggle: () => void } {
  const theme = useSyncExternalStore(
    subscribeTheme,
    getThemeSnapshot,
    getServerThemeSnapshot,
  );
  return { theme, toggle: toggleTheme };
}
