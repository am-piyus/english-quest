import type { Lesson } from "@/types/lesson";
import { validateLesson } from "@/lib/contentParser";
import day1 from "@/data/day1.json";
import day2 from "@/data/day2.json";

/**
 * Lesson registry — the single place lessons are wired in.
 *
 * To publish a new lesson: create data/dayN.json (copy data/day-template.json),
 * then add it to the array below. The dashboard, calendar, and /session/N route
 * all derive from this registry, so no other code changes are needed. See
 * docs/content-authoring-guide.md.
 */
const registered: unknown[] = [day1, day2];

// Validate each lesson at load; invalid ones are skipped (and reported) rather
// than breaking the UI. Authoring mistakes show up in dev/build logs.
const lessons: Lesson[] = [];
for (const entry of registered) {
  const errors = validateLesson(entry);
  if (errors.length > 0) {
    const day = (entry as { day?: unknown })?.day ?? "?";
    console.warn(
      `[lessonContent] Skipping invalid lesson (day ${day}):\n - ${errors.join("\n - ")}`,
    );
    continue;
  }
  lessons.push(entry as unknown as Lesson);
}

const byDay = new Map(lessons.map((l) => [l.day, l]));

export function getAllLessons(): Lesson[] {
  return [...lessons].sort((a, b) => a.day - b.day);
}

export function getLesson(day: number): Lesson | null {
  return byDay.get(day) ?? null;
}

export function hasLesson(day: number): boolean {
  return byDay.has(day);
}
