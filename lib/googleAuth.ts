"use client";

/**
 * Client-side "Sign in with Google" via Google Identity Services (GIS).
 *
 * GIS returns a signed ID token (JWT) entirely in the browser — no backend and
 * no client secret — which makes it a perfect fit for a static GitHub Pages
 * site. The client ID is public (safe to bake into the build). When it's not
 * configured, Google sign-in simply isn't offered and the demo login is used.
 *
 * Droplet 25.3.2.1 (Authentication Infrastructure): every failure path now
 * surfaces a meaningful, typed error instead of failing silently, and sign-out
 * is made predictable by disabling GIS auto-select.
 *
 * Note: the ID token is trusted client-side only. Server-side signature
 * verification (and a real session) is a V0.2 item for when the app moves to a
 * backend host — it can't run on static GitHub Pages.
 */

export const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
export const googleEnabled = googleClientId.length > 0;

// A Google OAuth client ID is public and always ends with this suffix. We don't
// hard-fail on a mismatch (in case Google changes formats), but it lets the UI
// warn when an obviously-wrong value was configured.
export const googleClientIdLooksValid = googleClientId.endsWith(
  ".apps.googleusercontent.com",
);

export interface GoogleProfile {
  name: string;
  email: string;
  picture?: string;
}

export type GoogleAuthErrorCode =
  | "unconfigured" // no client ID baked into the build
  | "misconfigured" // a client ID is set but doesn't look like a real one
  | "script-load" // GIS script failed to load (offline / blocked by an extension)
  | "unavailable" // GIS loaded but the API object is missing
  | "no-credential" // Google returned without a usable credential
  | "no-email" // credential decoded but carried no email address
  | "decode"; // credential could not be decoded

export interface GoogleAuthError {
  code: GoogleAuthErrorCode;
  /** Human-friendly and safe to show the user. */
  message: string;
}

const MESSAGES: Record<GoogleAuthErrorCode, string> = {
  unconfigured: "Google sign-in isn't set up for this site yet.",
  misconfigured: "Google sign-in is misconfigured for this site.",
  "script-load":
    "Couldn't reach Google. Check your connection (or a tracker/ad blocker) and try again.",
  unavailable: "Google sign-in couldn't start. Please try again.",
  "no-credential": "Google didn't finish signing you in. Please try again.",
  "no-email": "Google didn't share your email address. Please try again.",
  decode: "We couldn't read your Google account. Please try again.",
};

function authError(code: GoogleAuthErrorCode): GoogleAuthError {
  return { code, message: MESSAGES[code] };
}

let scriptPromise: Promise<void> | null = null;

function loadGsiScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("GIS can only load in the browser"));
  }
  if (window.google?.accounts?.id) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      // Let the next attempt re-try the load instead of caching the failure.
      scriptPromise = null;
      reject(new Error("Failed to load Google sign-in"));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

function decodeJwtPayload(jwt: string): Record<string, unknown> {
  const base64Url = jwt.split(".")[1] ?? "";
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

/**
 * Loads GIS, wires the callback, and renders Google's official button into the
 * given container. Resolves once the button is rendered (or an error has been
 * reported). Every failure calls `onError` with a typed, user-safe message —
 * nothing is swallowed.
 */
export async function renderGoogleButton(
  container: HTMLElement,
  onProfile: (profile: GoogleProfile) => void,
  onError: (error: GoogleAuthError) => void,
): Promise<void> {
  if (!googleEnabled) {
    onError(authError("unconfigured"));
    return;
  }
  if (!googleClientIdLooksValid) {
    onError(authError("misconfigured"));
    return;
  }

  try {
    await loadGsiScript();
  } catch {
    onError(authError("script-load"));
    return;
  }

  const id = window.google?.accounts.id;
  if (!id) {
    onError(authError("unavailable"));
    return;
  }

  id.initialize({
    client_id: googleClientId,
    // Keep the experience predictable: never silently auto-pick an account, and
    // use the modern FedCM flow so it keeps working as third-party cookies end.
    auto_select: false,
    cancel_on_tap_outside: true,
    use_fedcm_for_prompt: true,
    callback: ({ credential }) => {
      if (!credential) {
        onError(authError("no-credential"));
        return;
      }
      let payload: Record<string, unknown>;
      try {
        payload = decodeJwtPayload(credential);
      } catch {
        onError(authError("decode"));
        return;
      }
      const email = String(payload.email ?? "");
      if (!email) {
        onError(authError("no-email"));
        return;
      }
      onProfile({
        name: String(payload.name ?? email.split("@")[0] ?? "Learner"),
        email,
        picture: payload.picture ? String(payload.picture) : undefined,
      });
    },
  });

  id.renderButton(container, {
    type: "standard",
    theme: "outline",
    size: "large",
    shape: "pill",
    text: "continue_with",
    logo_alignment: "center",
    width: 280,
  });
}
