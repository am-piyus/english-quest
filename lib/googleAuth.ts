"use client";

/**
 * Client-side "Sign in with Google" via Google Identity Services (GIS).
 *
 * GIS returns a signed ID token (JWT) entirely in the browser — no backend and
 * no client secret — which makes it a perfect fit for a static GitHub Pages
 * site. The client ID is public (safe to bake into the build). When it's not
 * configured, Google sign-in simply isn't offered and the demo login is used.
 */

export const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
export const googleEnabled = googleClientId.length > 0;

export interface GoogleProfile {
  name: string;
  email: string;
  picture?: string;
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
    script.onerror = () => reject(new Error("Failed to load Google sign-in"));
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
 * given container. Resolves once the button is rendered.
 */
export async function renderGoogleButton(
  container: HTMLElement,
  onProfile: (profile: GoogleProfile) => void,
): Promise<void> {
  if (!googleEnabled) return;
  await loadGsiScript();
  const id = window.google?.accounts.id;
  if (!id) return;

  id.initialize({
    client_id: googleClientId,
    callback: ({ credential }) => {
      const payload = decodeJwtPayload(credential);
      onProfile({
        name: String(payload.name ?? "Learner"),
        email: String(payload.email ?? ""),
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
