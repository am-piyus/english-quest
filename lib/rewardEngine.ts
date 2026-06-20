import type { ScoreSummary } from "@/lib/scoringEngine";

/** Bonus stars on top of per-question stars. */
export const PERFECT_BONUS = 5;
export const SESSION_BONUS = 10;

export interface SessionRewards {
  base: number; // stars from questions
  perfectBonus: number; // all gradable questions correct
  sessionBonus: number; // for completing the session
  total: number;
  perfect: boolean;
}

/** Total reward for finishing a session, including completion bonuses. */
export function computeSessionRewards(summary: ScoreSummary): SessionRewards {
  const perfect = summary.gradable > 0 && summary.correct === summary.gradable;
  const perfectBonus = perfect ? PERFECT_BONUS : 0;
  return {
    base: summary.stars,
    perfectBonus,
    sessionBonus: SESSION_BONUS,
    total: summary.stars + perfectBonus + SESSION_BONUS,
    perfect,
  };
}
