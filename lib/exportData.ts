/**
 * "Export my data" (Droplet 25.3.2.2) — a last-resort safety net for a
 * device-local app with no cloud backup. Gathers the user's session, profile,
 * and progress (through the same validated getters) and downloads them as one
 * JSON file, entirely client-side (static-export friendly).
 */

import { getSession } from "@/lib/session";
import { getProfile } from "@/lib/userProfile";
import { getProgress } from "@/lib/progress";

export function buildExport(email: string) {
  return {
    app: "English Quest",
    exportedAt: new Date().toISOString(),
    session: getSession(),
    profile: getProfile(email),
    progress: getProgress(email),
  };
}

export function downloadUserData(email: string): void {
  if (typeof window === "undefined") return;
  const data = buildExport(email);
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `english-quest-data-${data.exportedAt.slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
