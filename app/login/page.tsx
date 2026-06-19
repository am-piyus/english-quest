import Link from "next/link";

// Placeholder sign-in screen. Google + demo login is wired up in Droplet 25.3.1.2.
// This stub exists so the landing-page CTA never points at a broken route.
export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="eq-card w-full max-w-md p-8 text-center">
        <span className="text-4xl" aria-hidden>
          🎓
        </span>
        <h1 className="mt-4 text-2xl font-bold text-ink">Sign in to English Quest</h1>
        <p className="mt-2 text-ink-soft">
          Sign-in is being set up. Check back in a moment — your daily quest is
          almost ready.
        </p>
        <Link href="/" className="eq-btn eq-btn-ghost mt-6">
          ← Back to home
        </Link>
      </div>
    </div>
  );
}
