/**
 * Lesson catalog (metadata only).
 *
 * This is a placeholder journey so the dashboard, calendar, and session routes
 * have believable data to render. Real lesson *content* (concepts + assignments)
 * is added by Droplet 25.3.1.4 and formalized as JSON in Droplet 25.3.1.8 — at
 * which point this metadata will be derived from those lesson files. The actual
 * worksheet material will be supplied by the user.
 *
 * The dashboard imports only the functions below, so the underlying source can
 * change later without touching any UI.
 */

export type Difficulty = "Easy" | "Medium" | "Hard";

export interface LessonMeta {
  day: number;
  title: string;
  topic: string;
  durationMin: number;
  difficulty: Difficulty;
  summary: string;
}

const catalog: LessonMeta[] = [
  {
    day: 1,
    title: "Talking about everyday life",
    topic: "Simple Present",
    durationMin: 15,
    difficulty: "Easy",
    summary: "Habits, routines, and general facts.",
  },
  {
    day: 2,
    title: "Describing what's happening now",
    topic: "Present Continuous",
    durationMin: 18,
    difficulty: "Medium",
    summary: "Actions happening at this moment.",
  },
  {
    day: 3,
    title: "Asking and answering questions",
    topic: "Question Forms",
    durationMin: 18,
    difficulty: "Medium",
    summary: "Yes/no and wh- questions.",
  },
  {
    day: 4,
    title: "Talking about the past",
    topic: "Simple Past",
    durationMin: 20,
    difficulty: "Medium",
    summary: "Completed actions and short stories.",
  },
  {
    day: 5,
    title: "Connecting your ideas",
    topic: "Conjunctions",
    durationMin: 20,
    difficulty: "Hard",
    summary: "and, but, because, so.",
  },
];

export function getAllLessonMeta(): LessonMeta[] {
  return catalog;
}

export function getLessonMeta(day: number): LessonMeta | null {
  return catalog.find((l) => l.day === day) ?? null;
}

export function totalLessons(): number {
  return catalog.length;
}
