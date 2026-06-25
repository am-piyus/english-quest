import type { Lesson, Question } from "@/types/lesson";
import type { ResponseMap } from "@/types/question";
import {
  RESULT_VERSION,
  LOGGED_RESULT_VERSION,
  type SessionResult,
  type LoggedResult,
} from "@/lib/progress";
import { sessionIdFor, type SessionSource } from "@/lib/customSessions";
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
    _v: RESULT_VERSION,
    day: lesson.day,
    completedAt: new Date().toISOString(),
    stars: rewards.total,
    accuracy: summary.accuracy,
    durationSec,
    correct: summary.correct,
    total: summary.gradable,
  };
}

/**
 * Build the session-keyed result record (Droplet 25.3.3.7) for any session
 * source — registry, shared, or local — so completion + per-question results are
 * logged uniformly, keyed by session id, for a future dashboard to read.
 */
export function buildLoggedResult(
  lesson: Lesson,
  source: SessionSource,
  responses: ResponseMap,
  durationSec: number,
): LoggedResult {
  const summary = summarize(allQuestions(lesson), Object.values(responses));
  const rewards = computeSessionRewards(summary);
  return {
    _v: LOGGED_RESULT_VERSION,
    sessionId: sessionIdFor(source),
    source: source.kind,
    day: lesson.day,
    title: lesson.title,
    completedAt: new Date().toISOString(),
    stars: rewards.total,
    accuracy: summary.accuracy,
    durationSec,
    correct: summary.correct,
    total: summary.gradable,
    responses: Object.values(responses),
  };
}
