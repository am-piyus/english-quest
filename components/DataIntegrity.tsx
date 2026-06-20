"use client";

import { useEffect } from "react";
import { parseStored, recoverKey } from "@/lib/storage";
import { SESSION_KEY, validateSession } from "@/lib/session";
import { profileKeyFor, migrateProfile } from "@/lib/userProfile";
import { progressKeyFor, migrateProgressMap } from "@/lib/progress";
import CorruptionNotice from "@/components/CorruptionNotice";

/**
 * Runs a one-time integrity pass on the localStorage keys (Droplet 25.3.2.2):
 * any key that fails validation is reset (that key only) and surfaced to the
 * user via <CorruptionNotice>. Mounted globally in the root layout so it covers
 * every route. The reset happens here, in an effect — never inside a render or a
 * store snapshot — so reads stay pure.
 */
export default function DataIntegrity() {
  useEffect(() => {
    const session = parseStored(SESSION_KEY, validateSession);
    if (session.status === "corrupt") {
      recoverKey(SESSION_KEY, "your sign-in", session.reason);
    }
    const email = session.status === "ok" ? session.value.email : null;
    if (email) {
      const profile = parseStored(profileKeyFor(email), migrateProfile);
      if (profile.status === "corrupt") {
        recoverKey(profileKeyFor(email), "your profile", profile.reason);
      }
      const progress = parseStored(progressKeyFor(email), migrateProgressMap);
      if (progress.status === "corrupt") {
        recoverKey(progressKeyFor(email), "your learning progress", progress.reason);
      }
    }
  }, []);

  return <CorruptionNotice />;
}
