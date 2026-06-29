import type { Difficulty, OptionBankQuestion, Question } from "@/types/lesson";
import type { AnswerResult } from "@/types/question";

/** Stars a question is worth, by difficulty (Easy 1 · Medium 2 · Hard 3). */
export function starsFor(difficulty?: Difficulty): number {
  switch (difficulty) {
    case "Hard":
      return 3;
    case "Medium":
      return 2;
    default:
      return 1;
  }
}

/**
 * Grade an option-bank question (Droplet 25.3.3.5): the stored answer is a JSON
 * array of chosen option indices (one per blank). Correct = every blank's chosen
 * index matches items[i].answer (all-or-nothing); stars follow the difficulty.
 */
export function gradeOptionBank(
  question: OptionBankQuestion,
  answer: string,
): { correct: boolean; stars: number } {
  let chosen: unknown;
  try {
    chosen = JSON.parse(answer);
  } catch {
    chosen = null;
  }
  const arr = Array.isArray(chosen) ? chosen : [];
  const correct =
    question.items.length > 0 &&
    question.items.every((it, i) => arr[i] === it.answer);
  return { correct, stars: correct ? starsFor(question.difficulty) : 0 };
}

/** Stars for a single found word in a word-search block (Droplet 25.3.3.6). */
export function scoreWordSearchWord(): number {
  return 1;
}

/** Stars for one spelling word (SpellQuest): first try 2 · retry 1 · revealed 0
 *  ("you can win, you can't lose" — never negative). */
export function scoreSpellWord(outcome: "first" | "retry" | "revealed"): number {
  return outcome === "first" ? 2 : outcome === "retry" ? 1 : 0;
}

/** Stars earned for a single answered question. Reflections aren't graded. */
export function scoreQuestion(question: Question, correct: boolean): number {
  if (question.type === "reflection") return 0;
  return correct ? starsFor(question.difficulty) : 0;
}

export interface ScoreSummary {
  gradable: number; // gradable units attempted-or-not
  correct: number;
  stars: number;
  accuracy: number; // 0–100 over gradable units
}

/** A gradable unit: anything that contributes to Total/Accuracy — an assignment
 *  question or a spelling word. Reflections aren't gradable, so they're excluded
 *  by whoever builds the unit list (see sessionTracker.gradableUnits). */
export interface GradableUnit {
  id: string;
}

/**
 * Aggregate responses over the session's gradable units into a score summary.
 * Counting by a unit list (not by question type) lets any block type — questions,
 * spelling words — feed the same summary with no special-casing here.
 */
export function summarize(
  units: GradableUnit[],
  responses: AnswerResult[],
): ScoreSummary {
  const byId = new Map(responses.map((r) => [r.questionId, r]));
  let correct = 0;
  let stars = 0;

  for (const u of units) {
    const r = byId.get(u.id);
    if (r?.correct) {
      correct += 1;
      stars += r.score;
    }
  }

  const gradable = units.length;
  const accuracy = gradable === 0 ? 0 : Math.round((correct / gradable) * 100);
  return { gradable, correct, stars, accuracy };
}
