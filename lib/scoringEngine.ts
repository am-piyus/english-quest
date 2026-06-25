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

/** Stars earned for a single answered question. Reflections aren't graded. */
export function scoreQuestion(question: Question, correct: boolean): number {
  if (question.type === "reflection") return 0;
  return correct ? starsFor(question.difficulty) : 0;
}

export interface ScoreSummary {
  gradable: number; // gradable (non-reflection) questions answered
  correct: number;
  stars: number;
  accuracy: number; // 0–100 over gradable questions
}

/** Aggregate a set of responses for the given questions into a score summary. */
export function summarize(
  questions: Question[],
  responses: AnswerResult[],
): ScoreSummary {
  const byId = new Map(responses.map((r) => [r.questionId, r]));
  let gradable = 0;
  let correct = 0;
  let stars = 0;

  for (const q of questions) {
    if (q.type === "reflection") continue;
    gradable += 1;
    const r = byId.get(q.id);
    if (r?.correct) {
      correct += 1;
      stars += r.score;
    }
  }

  const accuracy = gradable === 0 ? 0 : Math.round((correct / gradable) * 100);
  return { gradable, correct, stars, accuracy };
}
