import type { Lesson, Question } from "@/types/lesson";
import type { ResponseMap } from "@/types/question";
import {
  RESULT_VERSION,
  LOGGED_RESULT_VERSION,
  type SessionResult,
  type LoggedResult,
} from "@/lib/progress";
import { sessionIdFor, type SessionSource } from "@/lib/customSessions";
import { summarize, type GradableUnit } from "@/lib/scoringEngine";
import { spellRoundCount } from "@/lib/spellQuest";
import { computeSessionRewards } from "@/lib/rewardEngine";

/** Every question across a lesson's assignment sections, in order. */
export function allQuestions(lesson: Lesson): Question[] {
  return lesson.sections.flatMap((s) =>
    s.kind === "assignment" ? s.assignment.questions : [],
  );
}

/** Stable id for a spelling word — block by its section index, word by its index
 *  in the (deterministic) round. The player reports under the same id so the
 *  summary counts it (see SpellQuestBlock). */
export function spellWordId(sectionIndex: number, wordIndex: number): string {
  return `spell:${sectionIndex}:${wordIndex}`;
}

/**
 * Every gradable unit in a lesson, in order: assignment questions (minus
 * reflections) plus one unit per played spelling word. The summary counts these
 * uniformly, so adding a new gradable block type is just a branch here.
 */
export function gradableUnits(lesson: Lesson): GradableUnit[] {
  const units: GradableUnit[] = [];
  lesson.sections.forEach((s, idx) => {
    if (s.kind === "assignment") {
      for (const q of s.assignment.questions) {
        if (q.type !== "reflection") units.push({ id: q.id });
      }
    } else if (s.kind === "spell") {
      const n = spellRoundCount(s.spell);
      for (let i = 0; i < n; i++) units.push({ id: spellWordId(idx, i) });
    }
  });
  return units;
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
  const summary = summarize(gradableUnits(lesson), Object.values(responses));
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
  const summary = summarize(gradableUnits(lesson), Object.values(responses));
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
