import type { Revision } from "@/types/lesson";

/**
 * Revision block (Droplet 25.3.3.1) — an optional recap shown like a concept
 * screen. One renderer per block kind; SessionScreen switches on section.kind.
 */
export default function RevisionBlock({ revision }: { revision: Revision }) {
  const paragraphs = revision.summary.split("\n\n");

  return (
    <section className="eq-card p-6 sm:p-8">
      <span className="eq-chip mb-3">🔁 Revision</span>
      <h2 className="text-xl font-bold text-ink sm:text-2xl">
        {revision.title || "Quick revision"}
      </h2>
      {revision.refDay != null && (
        <p className="mt-1 text-sm font-semibold text-brand-dark">
          Revisiting Day {revision.refDay}
        </p>
      )}

      <div className="mt-4 space-y-4 text-[15px] leading-7 text-ink sm:text-base">
        {paragraphs.map((p, i) => (
          <p key={i} className="whitespace-pre-line">
            {p}
          </p>
        ))}
      </div>
    </section>
  );
}
