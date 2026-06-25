import type { Question } from "@/types/lesson";
import { gradeOptionBank } from "@/lib/scoringEngine";

/** Loosely normalize free text so small differences don't fail a match. */
export function normalize(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[.?!]+$/, "");
}

/**
 * Validate an answer against a question.
 * - choice questions: the answer is the selected option index (as a string)
 * - text questions: exact match against the answer or any alternate (normalized)
 * - reflection: "correct" simply means the learner wrote something
 */
export function isCorrect(question: Question, answer: string): boolean {
  switch (question.type) {
    case "mcq":
    case "case":
      return Number(answer) === question.answerIndex;
    case "fill-blank":
    case "structure": {
      const candidate = normalize(answer);
      if (candidate.length === 0) return false;
      const accepted = [question.answer, ...(question.alternates ?? [])];
      return accepted.some((a) => normalize(a) === candidate);
    }
    case "option-bank":
      // Correctness lives with the option-bank scoring branch (scoringEngine),
      // keeping isCorrect the single correctness gate for every question type.
      return gradeOptionBank(question, answer).correct;
    case "reflection":
      return answer.trim().length > 0;
  }
}
