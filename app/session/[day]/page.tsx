import { getAllLessonMeta } from "@/lib/lessons";
import SessionScreen from "@/components/SessionScreen";

// Pre-render a static page per known day (required for `output: export`).
export function generateStaticParams() {
  return getAllLessonMeta().map((lesson) => ({ day: String(lesson.day) }));
}

export default async function SessionPage({
  params,
}: {
  params: Promise<{ day: string }>;
}) {
  const { day } = await params;
  return <SessionScreen day={Number(day)} />;
}
