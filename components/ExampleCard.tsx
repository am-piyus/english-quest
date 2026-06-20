export default function ExampleCard({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-2 rounded-xl bg-paper-2 px-4 py-2.5 text-ink">
      <span className="text-brand" aria-hidden>
        💬
      </span>
      <span>{text}</span>
    </li>
  );
}
