/**
 * Skeleton export for AI-assisted authoring (Droplet 25.3.3.13).
 *
 * Serializes the CURRENT builder state to a JSON object and prepends a top-level
 * `_ai` instruction string — a self-describing prompt map. The creator copies it
 * into any external AI (no in-app call, no API key), the AI fills the empty
 * fields and returns completed JSON, which comes back through lib/importLesson.
 *
 * `_ai` is METADATA, never part of the Lesson — importLesson strips it. Keep this
 * instruction exact to the current types/lesson.ts; if the schema changes, change
 * this text too.
 */

import type { Lesson } from "@/types/lesson";

export const AI_INSTRUCTION =
  "You are filling in a language-learning session for the topic the user gives you. " +
  "This JSON is a SKELETON: fill every empty field (\"\", [], empty items) with real content for that topic, " +
  "and keep everything else EXACTLY as-is. Do not add, remove, or reorder sections, questions, options, items, or words — " +
  "keep every section `kind`, every question `type`, and all counts identical. " +
  "Per field: `title`/`topic`/`summary`/`objectives` describe the lesson; `concept.explanation`/`examples`/`note` teach it; " +
  "for each assignment question fill `prompt`; mcq/case — fill every `options` string and set `answerIndex` to the 0-based index of the correct option; " +
  "fill-blank/structure — fill `answer` (optionally `alternates`); " +
  "option-bank — fill `options` (the word bank) and each `items[].text` as a sentence containing \"___\" for the blank, with `answer` = the 0-based index into `options`; " +
  "reflection — fill `prompt` only; wordsearch — fill each `words` entry (single words, no spaces); spell — fill each word's `word` (plus optional `hint`/`example`). " +
  "Keep any field that is already non-empty. Return ONLY the JSON object — no commentary, no markdown code fences — and delete this `_ai` key from your output.";

/** The current builder lesson as a pretty-printed skeleton, `_ai` header first. */
export function skeletonJson(lesson: Lesson): string {
  return JSON.stringify({ _ai: AI_INSTRUCTION, ...lesson }, null, 2);
}
