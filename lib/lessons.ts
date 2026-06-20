import type { Lesson } from "@/types/lesson";
import { getAllLessons } from "@/lib/lessonContent";

export type { Difficulty } from "@/types/lesson";

/**
 * Lesson metadata for the dashboard, calendar, and session routes.
 *
 * Metadata is *derived* from the registered lesson content (lib/lessonContent.ts)
 * — there is no separate hardcoded catalog. Add a lesson there and it appears
 * here (and everywhere) automatically.
 */
export interface LessonMeta {
  day: number;
  title: string;
  topic: string;
  summary: string;
  durationMin: number;
  difficulty: Lesson["difficulty"];
}

function toMeta(lesson: Lesson): LessonMeta {
  return {
    day: lesson.day,
    title: lesson.title,
    topic: lesson.topic,
    summary: lesson.summary,
    durationMin: lesson.durationMin,
    difficulty: lesson.difficulty,
  };
}

export function getAllLessonMeta(): LessonMeta[] {
  return getAllLessons().map(toMeta);
}

export function getLessonMeta(day: number): LessonMeta | null {
  const lesson = getAllLessons().find((l) => l.day === day);
  return lesson ? toMeta(lesson) : null;
}

export function totalLessons(): number {
  return getAllLessons().length;
}
