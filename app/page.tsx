import Link from "next/link";

const features = [
  {
    icon: "📖",
    title: "Interactive lessons",
    body: "Read bite-sized concepts and clear examples — no more static PDFs to scroll through.",
  },
  {
    icon: "✏️",
    title: "Practice in place",
    body: "Answer multiple-choice, fill-in-the-blank, and sentence questions right inside the lesson.",
  },
  {
    icon: "⚡",
    title: "Instant feedback",
    body: "Know immediately if you're right, get a friendly hint if not, and try again.",
  },
  {
    icon: "⭐",
    title: "Earn stars & streaks",
    body: "Collect stars, keep your daily streak alive, and watch your progress grow.",
  },
];

const steps = [
  { n: "1", label: "Sign in" },
  { n: "2", label: "Open today's quest" },
  { n: "3", label: "Learn & practice" },
  { n: "4", label: "Earn stars" },
  { n: "5", label: "Track progress" },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      {/* Header */}
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-5">
        <span className="flex items-center gap-2 text-lg font-bold text-ink">
          <span aria-hidden>🎓</span> English&nbsp;Quest
        </span>
        <Link href="/login" className="text-sm font-semibold text-brand-dark hover:underline">
          Sign in
        </Link>
      </header>

      {/* Hero */}
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center px-6">
        <section className="flex flex-col items-center pt-10 pb-16 text-center sm:pt-16">
          <span className="eq-chip mb-5">🚀 Learn English, one quest a day</span>
          <h1 className="max-w-2xl text-4xl font-extrabold leading-tight tracking-tight text-ink sm:text-5xl">
            Turn daily English lessons into a game you actually want to play.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-ink-soft">
            English Quest replaces boring worksheets with interactive sessions,
            instant feedback, and rewards — so practice feels like progress.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/login" className="eq-btn eq-btn-primary">
              Start learning — it&apos;s free
            </Link>
            <a href="#how-it-works" className="eq-btn eq-btn-ghost">
              See how it works
            </a>
          </div>
        </section>

        {/* Features */}
        <section className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="eq-card flex flex-col gap-2 p-6">
              <span className="text-3xl" aria-hidden>
                {f.icon}
              </span>
              <h3 className="text-lg font-bold text-ink">{f.title}</h3>
              <p className="text-sm leading-6 text-ink-soft">{f.body}</p>
            </div>
          ))}
        </section>

        {/* How it works */}
        <section id="how-it-works" className="w-full scroll-mt-8 py-16">
          <h2 className="text-center text-2xl font-bold text-ink">How it works</h2>
          <ol className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center">
            {steps.map((s, i) => (
              <li key={s.n} className="flex items-center gap-3">
                <div className="eq-card flex items-center gap-3 px-4 py-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
                    {s.n}
                  </span>
                  <span className="font-semibold text-ink">{s.label}</span>
                </div>
                {i < steps.length - 1 && (
                  <span className="hidden text-brand sm:inline" aria-hidden>
                    →
                  </span>
                )}
              </li>
            ))}
          </ol>
        </section>
      </main>

      {/* Footer */}
      <footer className="mx-auto w-full max-w-5xl px-6 py-8 text-center text-sm text-ink-soft">
        <p>
          Built as a Weekly Project MVP · English Quest 🎓 · Learn a little, every
          day.
        </p>
      </footer>
    </div>
  );
}
