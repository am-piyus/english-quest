/**
 * First-run funnel draft (Droplet 25.3.2.5).
 *
 * Holds the visitor's first name BEFORE an account exists (the profile store is
 * keyed by email, which we don't have until sign-in). sessionStorage — not
 * localStorage — because this is a per-visit draft: it survives a reload and the
 * in-page Google round trip (same tab), but auto-clears when the tab closes so a
 * stale name can never leak into a later, unrelated visit. Cleared on sign-in.
 */

const FUNNEL_NAME_KEY = "eq:funnel:name";

export function setFunnelName(name: string): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(FUNNEL_NAME_KEY, name);
  } catch {
    /* storage blocked (private mode) — React state still carries the name */
  }
}

export function getFunnelName(): string {
  if (typeof window === "undefined") return "";
  try {
    return (window.sessionStorage.getItem(FUNNEL_NAME_KEY) ?? "").trim();
  } catch {
    return "";
  }
}

export function clearFunnelName(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(FUNNEL_NAME_KEY);
  } catch {
    /* ignore */
  }
}
