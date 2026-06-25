/**
 * Lesson content contract.
 *
 * This is the shared shape for lesson JSON files (data/dayN.json) consumed by
 * the session engine (Droplet 25.3.1.4), the assignment system (25.3.1.5), and
 * the authoring workflow (25.3.1.8). A lesson is an ordered list of sections —
 * concept screens and assignment screens — that the learner walks through.
 */

export type Difficulty = "Easy" | "Medium" | "Hard";

/** Multiple-choice and situational "case identification" questions. */
export interface ChoiceQuestion {
  id: string;
  type: "mcq" | "case";
  prompt: string;
  options: string[];
  answerIndex: number;
  hint?: string;
  feedback?: string;
  difficulty?: Difficulty;
}

/** Free-text questions validated against an exact / alternate answer. */
export interface TextQuestion {
  id: string;
  type: "fill-blank" | "structure";
  prompt: string;
  answer: string;
  alternates?: string[];
  hint?: string;
  feedback?: string;
  difficulty?: Difficulty;
}

/** Open reflection — stored, never graded. */
export interface ReflectionQuestion {
  id: string;
  type: "reflection";
  prompt: string;
  hint?: string;
}

/** Dash-fill from an option bank: each item is a sentence with one blank "___". */
export interface OptionBankQuestion {
  id: string;
  type: "option-bank";
  prompt?: string;
  options: string[]; // the bank
  items: { text: string; answer: number }[]; // answer = index into options
  hint?: string;
  feedback?: string;
  difficulty?: Difficulty;
}

export type Question =
  | ChoiceQuestion
  | TextQuestion
  | ReflectionQuestion
  | OptionBankQuestion;

export interface Concept {
  title: string;
  explanation: string; // paragraphs separated by blank lines
  examples?: string[];
  note?: string; // key insight / tip
}

export interface Assignment {
  title: string;
  intro?: string;
  questions: Question[];
}

/** Optional recap block — a short revision of earlier material (V0.2). */
export interface Revision {
  title?: string;
  summary: string; // short recap text (paragraphs separated by blank lines)
  refDay?: number; // optional: the earlier day this revises
}

/** A generated word-search puzzle block (V0.2). The grid is derived from the
 *  words at runtime (deterministically), so it isn't stored in the link. */
export interface WordSearch {
  title?: string;
  words: string[]; // builder default = 5
  gridSize: number; // MVP fixed = 15
}

export type Section =
  | { kind: "concept"; concept: Concept }
  | { kind: "assignment"; assignment: Assignment }
  | { kind: "revision"; revision: Revision }
  | { kind: "wordsearch"; wordsearch: WordSearch };

export interface Lesson {
  day: number;
  title: string;
  topic: string;
  summary: string; // one-line teaser shown on the dashboard/calendar
  difficulty: Difficulty;
  durationMin: number;
  objectives: string[];
  intro?: string;
  sections: Section[];
}
