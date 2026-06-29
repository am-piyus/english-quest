/**
 * Tolerant paste-back importer for AI-assisted authoring (Droplet 25.3.3.13).
 *
 * LLMs return almost-valid JSON. This is "tolerant in, strict out": strip code
 * fences + surrounding prose, parse, drop the `_ai` header and any unknown keys,
 * coerce/repair SAFE issues (missing ids, number-like strings, defaults, clamped
 * indices), and structurally validate against types/lesson.ts. The result loads
 * into the builder for human review — it is NOT saved; the existing
 * validateLesson + save path stays the final gate. Returns { lesson, repairs } or
 * { errors } with located, human-readable messages (never a raw stack trace).
 */

import type {
  Lesson,
  Section,
  Question,
  SpellWord,
  Difficulty,
} from "@/types/lesson";

export interface ImportSuccess {
  lesson: Lesson;
  repairs: string[];
}
export interface ImportFailure {
  errors: string[];
}
export type ImportOutcome = ImportSuccess | ImportFailure;

const DIFFICULTIES = ["Easy", "Medium", "Hard"];
const SECTION_KINDS = ["concept", "assignment", "revision", "wordsearch", "spell"];
const QUESTION_TYPES = [
  "mcq",
  "case",
  "fill-blank",
  "structure",
  "reflection",
  "option-bank",
];

interface Ctx {
  repairs: string[];
  errors: string[];
  dropped: number;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
function asString(v: unknown): string | null {
  return typeof v === "string" ? v : null;
}
function asNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) {
    return Number(v);
  }
  return null;
}
function asStringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}
function asDifficulty(v: unknown): Difficulty | undefined {
  return typeof v === "string" && DIFFICULTIES.includes(v) ? (v as Difficulty) : undefined;
}
function countExtras(raw: Record<string, unknown>, known: string[], ctx: Ctx) {
  for (const k of Object.keys(raw)) if (!known.includes(k)) ctx.dropped += 1;
}

let idSeq = 0;
function genId(): string {
  idSeq += 1;
  return "q_imp_" + idSeq.toString(36) + Math.random().toString(36).slice(2, 6);
}

/** Strip ```fences``` and any prose around the JSON object; trim. */
function stripToJson(raw: string): string {
  let s = (raw ?? "").trim();
  if (!s) return "";
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) s = fence[1].trim();
  const a = s.indexOf("{");
  const b = s.lastIndexOf("}");
  if (a !== -1 && b !== -1 && b > a) s = s.slice(a, b + 1);
  return s.trim();
}

export function importLesson(input: string): ImportOutcome {
  const cleaned = stripToJson(input);
  if (!cleaned) {
    return { errors: ["Nothing to import — paste the JSON the AI returned."] };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return {
      errors: [
        "That isn't valid JSON. Paste exactly the JSON the AI returned — no extra text or code fences.",
      ],
    };
  }
  if (!isRecord(parsed)) {
    return { errors: ["The session must be a single JSON object."] };
  }

  const ctx: Ctx = { repairs: [], errors: [], dropped: 0 };
  const lesson = coerceLesson(parsed, ctx);
  if (ctx.dropped > 0) {
    ctx.repairs.push(
      `Ignored ${ctx.dropped} unexpected field${ctx.dropped === 1 ? "" : "s"} (incl. the AI instructions header).`,
    );
  }
  if (ctx.errors.length > 0) return { errors: ctx.errors };
  return { lesson, repairs: ctx.repairs };
}

const TOP_KNOWN = [
  "day",
  "title",
  "topic",
  "summary",
  "difficulty",
  "durationMin",
  "objectives",
  "intro",
  "sections",
];

function coerceLesson(obj: Record<string, unknown>, ctx: Ctx): Lesson {
  countExtras(obj, TOP_KNOWN, ctx);

  const difficulty = asDifficulty(obj.difficulty) ?? "Easy";
  if (obj.difficulty != null && asDifficulty(obj.difficulty) === undefined) {
    ctx.repairs.push("Difficulty wasn't valid — set to Easy.");
  }
  const durationMin = asNumber(obj.durationMin) ?? 10;
  if (typeof obj.durationMin === "string" && asNumber(obj.durationMin) !== null) {
    ctx.repairs.push("Converted durationMin from text to a number.");
  }
  if (typeof obj.day === "string" && asNumber(obj.day) !== null) {
    ctx.repairs.push("Converted day from text to a number.");
  }

  let sections: Section[] = [];
  if (obj.sections === undefined) {
    ctx.errors.push("`sections` is missing — the session has no blocks.");
  } else if (!Array.isArray(obj.sections)) {
    ctx.errors.push("`sections` must be an array.");
  } else {
    sections = obj.sections
      .map((s, i) => coerceSection(s, i, ctx))
      .filter((s): s is Section => s !== null);
  }

  return {
    day: asNumber(obj.day) ?? 0,
    title: asString(obj.title) ?? "",
    topic: asString(obj.topic) ?? "",
    summary: asString(obj.summary) ?? "",
    difficulty,
    durationMin,
    objectives: asStringArray(obj.objectives),
    intro: asString(obj.intro) ?? undefined,
    sections,
  };
}

function coerceSection(raw: unknown, i: number, ctx: Ctx): Section | null {
  const at = `Section ${i + 1}`;
  if (!isRecord(raw)) {
    ctx.errors.push(`${at}: must be an object.`);
    return null;
  }
  const kind = raw.kind;
  if (typeof kind !== "string" || !SECTION_KINDS.includes(kind)) {
    ctx.errors.push(`${at}: unknown block kind ${JSON.stringify(kind)}.`);
    return null;
  }
  countExtras(raw, ["kind", kind], ctx);

  if (kind === "concept") {
    const c = raw.concept;
    if (!isRecord(c)) {
      ctx.errors.push(`${at} (concept): missing concept data.`);
      return null;
    }
    countExtras(c, ["title", "explanation", "examples", "note"], ctx);
    return {
      kind: "concept",
      concept: {
        title: asString(c.title) ?? "",
        explanation: asString(c.explanation) ?? "",
        examples: asStringArray(c.examples),
        note: asString(c.note) ?? undefined,
      },
    };
  }

  if (kind === "revision") {
    const r = raw.revision;
    if (!isRecord(r)) {
      ctx.errors.push(`${at} (revision): missing revision data.`);
      return null;
    }
    countExtras(r, ["title", "summary", "refDay"], ctx);
    return {
      kind: "revision",
      revision: {
        title: asString(r.title) ?? undefined,
        summary: asString(r.summary) ?? "",
        refDay: asNumber(r.refDay) ?? undefined,
      },
    };
  }

  if (kind === "wordsearch") {
    const w = raw.wordsearch;
    if (!isRecord(w)) {
      ctx.errors.push(`${at} (word search): missing word-search data.`);
      return null;
    }
    countExtras(w, ["title", "words", "gridSize"], ctx);
    const g = asNumber(w.gridSize);
    const gridSize = g === 10 ? 10 : g === 15 ? 15 : 15;
    if (g !== 10 && g !== 15) {
      ctx.repairs.push(`${at}: word-search grid size set to 15.`);
    }
    return {
      kind: "wordsearch",
      wordsearch: {
        title: asString(w.title) ?? undefined,
        words: asStringArray(w.words),
        gridSize,
      },
    };
  }

  if (kind === "spell") {
    const sp = raw.spell;
    if (!isRecord(sp)) {
      ctx.errors.push(`${at} (spelling): missing spelling data.`);
      return null;
    }
    countExtras(sp, ["title", "words", "count", "level"], ctx);
    const words: SpellWord[] = Array.isArray(sp.words)
      ? sp.words
          .map((w): SpellWord | null => {
            if (typeof w === "string") return { word: w };
            if (isRecord(w) && typeof w.word === "string") {
              return {
                word: w.word,
                hint: asString(w.hint) ?? undefined,
                example: asString(w.example) ?? undefined,
              };
            }
            return null;
          })
          .filter((w): w is SpellWord => w !== null)
      : [];
    const level =
      sp.level === "Beginner" || sp.level === "Intermediate" ? sp.level : undefined;
    return {
      kind: "spell",
      spell: {
        title: asString(sp.title) ?? undefined,
        words,
        count: asNumber(sp.count) ?? undefined,
        level,
      },
    };
  }

  // assignment
  const a = raw.assignment;
  if (!isRecord(a)) {
    ctx.errors.push(`${at} (assignment): missing assignment data.`);
    return null;
  }
  countExtras(a, ["title", "intro", "questions"], ctx);
  if (!Array.isArray(a.questions)) {
    ctx.errors.push(`${at} (assignment): \`questions\` must be an array.`);
    return null;
  }
  const questions = a.questions
    .map((q, j) => coerceQuestion(q, i, j, ctx))
    .filter((q): q is Question => q !== null);
  return {
    kind: "assignment",
    assignment: {
      title: asString(a.title) ?? "",
      intro: asString(a.intro) ?? undefined,
      questions,
    },
  };
}

function coerceQuestion(
  raw: unknown,
  sectionIdx: number,
  qIdx: number,
  ctx: Ctx,
): Question | null {
  const at = `Section ${sectionIdx + 1} (assignment) q${qIdx + 1}`;
  if (!isRecord(raw)) {
    ctx.errors.push(`${at}: must be an object.`);
    return null;
  }
  const type = raw.type;
  if (typeof type !== "string" || !QUESTION_TYPES.includes(type)) {
    ctx.errors.push(`${at}: unknown question type ${JSON.stringify(type)}.`);
    return null;
  }

  let id = asString(raw.id);
  if (id === null) {
    id = genId();
    ctx.repairs.push(`${at}: generated a missing id.`);
  }
  const prompt = asString(raw.prompt) ?? "";
  const hint = asString(raw.hint) ?? undefined;
  const feedback = asString(raw.feedback) ?? undefined;
  const difficulty = asDifficulty(raw.difficulty);

  if (type === "mcq" || type === "case") {
    countExtras(raw, ["id", "type", "prompt", "options", "answerIndex", "hint", "feedback", "difficulty"], ctx);
    if (!Array.isArray(raw.options)) {
      ctx.errors.push(`${at}: ${type} needs an \`options\` array.`);
      return null;
    }
    const options = asStringArray(raw.options);
    if (options.length < 2) {
      ctx.errors.push(`${at}: needs at least 2 options.`);
      return null;
    }
    let answerIndex = asNumber(raw.answerIndex);
    if (answerIndex === null) {
      answerIndex = 0;
      ctx.repairs.push(`${at}: answerIndex defaulted to the first option.`);
    } else if (typeof raw.answerIndex === "string") {
      ctx.repairs.push(`${at}: converted answerIndex from text to a number.`);
    }
    const clamped = Math.min(Math.max(0, Math.round(answerIndex)), options.length - 1);
    if (clamped !== answerIndex) {
      ctx.repairs.push(`${at}: answerIndex clamped to a valid option.`);
    }
    return { id, type, prompt, options, answerIndex: clamped, hint, feedback, difficulty };
  }

  if (type === "fill-blank" || type === "structure") {
    countExtras(raw, ["id", "type", "prompt", "answer", "alternates", "hint", "feedback", "difficulty"], ctx);
    const alternates = Array.isArray(raw.alternates)
      ? asStringArray(raw.alternates)
      : undefined;
    return { id, type, prompt, answer: asString(raw.answer) ?? "", alternates, hint, feedback, difficulty };
  }

  if (type === "option-bank") {
    countExtras(raw, ["id", "type", "prompt", "options", "items", "hint", "feedback", "difficulty"], ctx);
    if (!Array.isArray(raw.options)) {
      ctx.errors.push(`${at}: option-bank needs an \`options\` array.`);
      return null;
    }
    const options = asStringArray(raw.options);
    if (options.length < 2) {
      ctx.errors.push(`${at}: option-bank needs at least 2 options.`);
      return null;
    }
    if (!Array.isArray(raw.items)) {
      ctx.errors.push(`${at}: option-bank needs an \`items\` array.`);
      return null;
    }
    const items = raw.items.map((it) => {
      const text = isRecord(it) ? (asString(it.text) ?? "") : "";
      const rawAnswer = isRecord(it) ? it.answer : undefined;
      let answer = asNumber(rawAnswer) ?? 0;
      if (typeof rawAnswer === "string" && asNumber(rawAnswer) !== null) {
        ctx.repairs.push(`${at}: converted an item answer from text to a number.`);
      }
      const clamped = Math.min(Math.max(0, Math.round(answer)), options.length - 1);
      if (clamped !== answer) {
        ctx.repairs.push(`${at}: an item answer was clamped to a valid option.`);
      }
      answer = clamped;
      return { text, answer };
    });
    if (items.length < 1) {
      ctx.errors.push(`${at}: option-bank needs at least 1 item.`);
      return null;
    }
    return { id, type: "option-bank", prompt, options, items, hint, feedback, difficulty };
  }

  // reflection — id + prompt (+ optional hint) only
  countExtras(raw, ["id", "type", "prompt", "hint"], ctx);
  return { id, type: "reflection", prompt, hint };
}
