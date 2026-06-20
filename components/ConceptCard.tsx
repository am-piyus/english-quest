import type { Concept } from "@/types/lesson";
import ExampleCard from "@/components/ExampleCard";

export default function ConceptCard({ concept }: { concept: Concept }) {
  const paragraphs = concept.explanation.split("\n\n");

  return (
    <section className="eq-card p-6 sm:p-8">
      <span className="eq-chip mb-3">📖 Concept</span>
      <h2 className="text-xl font-bold text-ink sm:text-2xl">{concept.title}</h2>

      <div className="mt-4 space-y-4 text-[15px] leading-7 text-ink sm:text-base">
        {paragraphs.map((p, i) => (
          <p key={i} className="whitespace-pre-line">
            {p}
          </p>
        ))}
      </div>

      {concept.examples && concept.examples.length > 0 && (
        <div className="mt-5">
          <p className="text-sm font-bold text-ink">Examples</p>
          <ul className="mt-2 space-y-2">
            {concept.examples.map((ex) => (
              <ExampleCard key={ex} text={ex} />
            ))}
          </ul>
        </div>
      )}

      {concept.note && (
        <div className="mt-5 rounded-2xl bg-amber-soft px-4 py-3 text-sm text-ink">
          <span className="font-bold">💡 Tip: </span>
          {concept.note}
        </div>
      )}
    </section>
  );
}
