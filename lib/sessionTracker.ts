import type { Lesson, Question } from "@/types/lesson";
import type { ResponseMap } from "@/types/question";
import type { SessionResult } from "@/lib/progress";
import { summarize } from "@/lib/scoringEngine";
import { computeSessionRewards } from "@/lib/rewardEngine";

/** Every question across a lesson's assignment sections, in order. */
export function allQuestions(lesson: Lesson): Question[] {
  return lesson.sections.flatMap((s) =>
    s.kind === "assignment" ? s.assignment.questions : [],
  );
}

/**
 * Build the persisted result for a finished session: aggregate score + reward
 * bonuses (perfect, completion) + engagement metrics. Saved to the progress
 * store so the dashboard and summary can read it back.
 */
export function buildSessionResult(
  lesson: Lesson,
  responses: ResponseMap,
  durationSec: number,
): SessionResult {
  const summary = summarize(allQuestions(lesson), Object.values(responses));
  const rewards = computeSessionRewards(summary);
  return {
    day: lesson.day,
    completedAt: new Date().toISOString(),
    stars: rewards.total,
    accuracy: summary.accuracy,
    durationSec,
    correct: summary.correct,
    total: summary.gradable,
  };
}
