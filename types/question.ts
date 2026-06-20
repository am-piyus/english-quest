/** The recorded outcome of answering a single question. */
export interface AnswerResult {
  questionId: string;
  answer: string; // choice index (as string) or free text
  correct: boolean;
  score: number; // stars earned for this question
}

export type ResponseMap = Record<string, AnswerResult>;
