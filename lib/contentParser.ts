import type { Lesson } from "@/types/lesson";

/**
 * Runtime validation for lesson JSON. Returns a list of human-readable problems
 * (empty = valid). Used by the loader so authoring mistakes surface immediately
 * in dev/build logs instead of breaking the UI at runtime.
 */

const DIFFICULTIES = ["Easy", "Medium", "Hard"];
const QUESTION_TYPES = [
  "mcq",
  "case",
  "fill-blank",
  "structure",
  "reflection",
  "option-bank",
];

export function validateLesson(raw: unknown): string[] {
  if (typeof raw !== "object" || raw === null) return ["lesson must be an object"];
  const l = raw as Record<string, unknown>;
  const errors: string[] = [];

  if (typeof l.day !== "number") errors.push("`day` must be a number");
  for (const field of ["title", "topic", "summary"]) {
    if (typeof l[field] !== "string" || (l[field] as string).trim() === "") {
      errors.push(`\`${field}\` must be a non-empty string`);
    }
  }
  if (typeof l.durationMin !== "number") errors.push("`durationMin` must be a number");
  if (!DIFFICULTIES.includes(l.difficulty as string)) {
    errors.push("`difficulty` must be Easy, Medium, or Hard");
  }
  if (!Array.isArray(l.objectives) || l.objectives.length === 0) {
    errors.push("`objectives` must be a non-empty array");
  }
  if (!Array.isArray(l.sections) || l.sections.length === 0) {
    errors.push("`sections` must be a non-empty array");
  } else {
    l.sections.forEach((section, i) => {
      errors.push(...validateSection(section, i));
    });
  }
  return errors;
}

function validateSection(raw: unknown, index: number): string[] {
  const where = `sections[${index}]`;
  if (typeof raw !== "object" || raw === null) return [`${where} must be an object`];
  const s = raw as Record<string, unknown>;

  if (s.kind === "concept") {
    const c = s.concept as Record<string, unknown> | undefined;
    if (!c || typeof c.title !== "string" || typeof c.explanation !== "string") {
      return [`${where}.concept needs a title and explanation`];
    }
    return [];
  }

  if (s.kind === "revision") {
    const r = s.revision as Record<string, unknown> | undefined;
    if (!r || typeof r.summary !== "string" || r.summary.trim() === "") {
      return [`${where}.revision needs a non-empty summary`];
    }
    return [];
  }

  if (s.kind === "assignment") {
    const a = s.assignment as Record<string, unknown> | undefined;
    if (!a || typeof a.title !== "string") return [`${where}.assignment needs a title`];
    if (!Array.isArray(a.questions) || a.questions.length === 0) {
      return [`${where}.assignment needs at least one question`];
    }
    const errs: string[] = [];
    a.questions.forEach((q, j) => {
      errs.push(...validateQuestion(q, `${where}.questions[${j}]`));
    });
    return errs;
  }

  return [`${where}.kind must be "concept", "assignment", or "revision"`];
}

function validateQuestion(raw: unknown, where: string): string[] {
  if (typeof raw !== "object" || raw === null) return [`${where} must be an object`];
  const q = raw as Record<string, unknown>;
  const errs: string[] = [];

  if (typeof q.id !== "string") errs.push(`${where}.id must be a string`);
  if (typeof q.prompt !== "string") errs.push(`${where}.prompt must be a string`);
  if (!QUESTION_TYPES.includes(q.type as string)) {
    errs.push(`${where}.type must be one of ${QUESTION_TYPES.join(", ")}`);
    return errs;
  }
  if (q.type === "mcq" || q.type === "case") {
    if (!Array.isArray(q.options) || q.options.length < 2) {
      errs.push(`${where}.options must have at least 2 items`);
    }
    if (typeof q.answerIndex !== "number") {
      errs.push(`${where}.answerIndex must be a number`);
    }
  }
  if (q.type === "fill-blank" || q.type === "structure") {
    if (typeof q.answer !== "string") errs.push(`${where}.answer must be a string`);
  }
  if (q.type === "option-bank") {
    if (!Array.isArray(q.options) || q.options.length < 2) {
      errs.push(`${where}.options must have at least 2 items`);
    }
    if (!Array.isArray(q.items) || q.items.length < 1) {
      errs.push(`${where}.items must have at least 1 sentence`);
    } else {
      q.items.forEach((raw, k) => {
        const it = raw as Record<string, unknown>;
        if (typeof it?.text !== "string") {
          errs.push(`${where}.items[${k}].text must be a string`);
        }
        if (typeof it?.answer !== "number") {
          errs.push(`${where}.items[${k}].answer must be a number`);
        }
      });
    }
  }
  return errs;
}

/** Convenience guard used by tooling/tests. */
export function isValidLesson(raw: unknown): raw is Lesson {
  return validateLesson(raw).length === 0;
}
