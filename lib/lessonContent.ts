import type { Lesson } from "@/types/lesson";
import day1 from "@/data/day1.json";
import day2 from "@/data/day2.json";

/**
 * Lesson registry. New lessons are added by dropping a data/dayN.json file and
 * registering it here — no UI changes required (see Droplet 25.3.1.8). The JSON
 * is cast through `unknown` because TypeScript infers wide types from JSON
 * imports; the authoring guide + content validator are the real safety net.
 */
const lessons: Record<number, Lesson> = {
  1: day1 as unknown as Lesson,
  2: day2 as unknown as Lesson,
};

export function getLesson(day: number): Lesson | null {
  return lessons[day] ?? null;
}

export function hasLesson(day: number): boolean {
  return day in lessons;
}
