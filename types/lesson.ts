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

export type Question = ChoiceQuestion | TextQuestion | ReflectionQuestion;

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

export type Section =
  | { kind: "concept"; concept: Concept }
  | { kind: "assignment"; assignment: Assignment };

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
