"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
} from "react";
import type { SpellQuest } from "@/types/lesson";
import type { AnswerResult } from "@/types/question";
import { selectSpellWords } from "@/lib/spellQuest";
import { scoreSpellWord } from "@/lib/scoringEngine";
import { spellWordId } from "@/lib/sessionTracker";

/**
 * SpellQuest player (V1) — a spelling test. The word is NEVER shown: the prompt is
 * an audio "Hear the word" button (Web Speech API, generated client-side) plus the
 * author's optional hint/example, with the target word MASKED out of both so an
 * example sentence can't reveal the spelling. Grading is on submit only (never per
 * keystroke): exact = green; Levenshtein 1–2 = amber "so close" + one retry; else
 * red + one retry; a second miss reveals the word. Results report up per word
 * exactly like an assignment question, so the existing session summary (Total /
 * Accuracy / Correct / Stars / Time) consumes them with no new results screen.
 * "You can win, you can't lose": a miss is zero stars, never negative.
 */

type Feedback =
  | { kind: "green" | "red" | "reveal"; message: string }
  | { kind: "yellow"; message: string; attempt: string };

/** Levenshtein edit distance (small words — a simple DP is plenty). */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const curr = [i];
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    prev = curr;
  }
  return prev[n];
}

/** Mask whole-word occurrences of the target in author text, so a hint or example
 *  sentence never spells the answer out. */
function maskWord(text: string, word: string): string {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text.replace(new RegExp(`\\b${escaped}\\b`, "gi"), "_____");
}

// Web Speech support, read via an external store so it's correct on the client
// without a setState-in-effect or a hydration mismatch (server snapshot = false).
const subscribeNoop = () => () => {};
const readSpeechSupport = () =>
  typeof window !== "undefined" && "speechSynthesis" in window;
const readSpeechServer = () => false;

export default function SpellQuestBlock({
  spell,
  sectionIndex,
  onAnswer,
}: {
  spell: SpellQuest;
  sectionIndex: number;
  onAnswer: (result: AnswerResult) => void;
}) {
  const words = useMemo(() => selectSpellWords(spell), [spell]);

  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState("");
  const [attempt, setAttempt] = useState(0); // wrong submits on the current word
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [locked, setLocked] = useState(false); // input frozen during auto-advance
  const [finished, setFinished] = useState(false);
  const [stars, setStars] = useState(0);
  const [resolved, setResolved] = useState(0);
  const speechOk = useSyncExternalStore(
    subscribeNoop,
    readSpeechSupport,
    readSpeechServer,
  );

  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Stop any pending auto-advance / speech when the block unmounts.
  useEffect(
    () => () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    },
    [],
  );

  const total = words.length;
  const current = words[idx];
  const level = spell.level ?? "Beginner";

  function speak() {
    if (typeof window === "undefined" || !window.speechSynthesis || !current) return;
    const u = new SpeechSynthesisUtterance(current.word);
    u.lang = "en-US";
    u.rate = 0.9;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }

  function report(correct: boolean, outcome: "first" | "retry" | "revealed", typed: string) {
    const sc = scoreSpellWord(outcome);
    onAnswer({ questionId: spellWordId(sectionIndex, idx), answer: typed, correct, score: sc });
    setStars((s) => s + sc);
    setResolved((n) => n + 1);
  }

  function advance() {
    setInput("");
    setAttempt(0);
    setFeedback(null);
    setLocked(false);
    if (idx >= total - 1) setFinished(true);
    else setIdx((i) => i + 1);
  }

  function scheduleAdvance(ms: number) {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    advanceTimer.current = setTimeout(() => {
      advanceTimer.current = null;
      advance();
    }, ms);
  }

  function submit(e?: FormEvent) {
    e?.preventDefault();
    if (locked || finished || !current) return;
    const typed = input.trim();
    if (!typed) return;
    const target = current.word.trim();

    if (typed.toLowerCase() === target.toLowerCase()) {
      report(true, attempt === 0 ? "first" : "retry", typed);
      setFeedback({ kind: "green", message: "Correct — nicely spelled!" });
      setLocked(true);
      scheduleAdvance(950);
      return;
    }
    if (attempt === 0) {
      const close = levenshtein(typed.toLowerCase(), target.toLowerCase()) <= 2;
      setAttempt(1);
      setFeedback(
        close
          ? { kind: "yellow", message: "So close — one letter off. Try again.", attempt: typed }
          : { kind: "red", message: "Not quite — give it another try." },
      );
      return; // stays editable for the single retry
    }
    // second miss → reveal the spelling and move on (zero stars, never negative)
    report(false, "revealed", typed);
    setFeedback({ kind: "reveal", message: `The spelling is ${target}. You'll get the next one.` });
    setLocked(true);
    scheduleAdvance(1700);
  }

  function onInputChange(v: string) {
    setInput(v);
    if (feedback && !locked) setFeedback(null); // editing clears a stale hint
  }

  const fbColor =
    feedback?.kind === "green"
      ? "text-success"
      : feedback?.kind === "yellow"
        ? "text-amber"
        : feedback?.kind === "red"
          ? "text-danger"
          : "text-ink";

  return (
    <section className="eq-card p-5 sm:p-6">
      <span className="eq-chip mb-3">🔤 Spelling</span>
      {spell.title && <h2 className="text-xl font-bold text-ink">{spell.title}</h2>}
      <p className="mt-1 text-sm text-ink-soft">
        Spell well, go far. · <span className="font-semibold">{level}</span>
      </p>

      {total === 0 ? (
        <p className="mt-4 rounded-2xl bg-paper-2 p-4 text-sm text-ink-soft">
          No spelling words in this block yet.
        </p>
      ) : finished ? (
        <div className="mt-4 rounded-2xl bg-success-soft p-5 text-center ring-1 ring-success/40">
          <p className="text-lg font-bold text-ink">Round complete — nicely done! 🎉</p>
          <p className="mt-1 text-sm font-semibold text-ink">
            {resolved} of {total} · <span className="text-amber">⭐ {stars}</span>
          </p>
        </div>
      ) : (
        <>
          <p className="mt-4 text-sm font-semibold text-ink-soft">
            Word {idx + 1} of {total}
          </p>

          <div className="mt-3 flex flex-col items-center gap-3">
            {speechOk ? (
              <button
                type="button"
                onClick={speak}
                className="eq-btn eq-btn-primary px-5 py-3"
                aria-label="Hear the word"
              >
                🔊 Hear the word
              </button>
            ) : (
              <p className="rounded-lg bg-amber-soft px-3 py-2 text-center text-xs text-ink">
                🔇 Audio isn&apos;t available on this device — use the hint below.
              </p>
            )}

            {current.hint && (
              <p className="text-center text-sm text-ink">
                💡 {maskWord(current.hint, current.word)}
              </p>
            )}
            {current.example && (
              <p className="text-center text-sm italic text-ink-soft">
                “{maskWord(current.example, current.word)}”
              </p>
            )}
          </div>

          <form onSubmit={submit} className="mt-4 flex flex-col items-center gap-3">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              disabled={locked}
              type="text"
              inputMode="text"
              spellCheck={false}
              autoCorrect="off"
              autoCapitalize="off"
              autoComplete="off"
              placeholder="Type the spelling…"
              aria-label="Type the spelling"
              className="w-full max-w-sm rounded-xl bg-surface px-4 py-3 text-center text-lg font-semibold text-ink ring-1 ring-ink/15 outline-none focus:ring-2 focus:ring-brand disabled:opacity-70"
            />
            <button
              type="submit"
              disabled={locked || input.trim() === ""}
              className="eq-btn eq-btn-primary w-full max-w-sm py-3 text-sm"
            >
              Submit
            </button>
          </form>

          {feedback && (
            <div className="mt-3 text-center">
              <p className={`text-sm font-semibold ${fbColor}`}>{feedback.message}</p>
              {feedback.kind === "yellow" && (
                <p className="mt-1 text-base font-bold tracking-wide" aria-hidden>
                  {feedback.attempt.split("").map((ch, i) => {
                    const off =
                      i >= current.word.length ||
                      ch.toLowerCase() !== current.word[i].toLowerCase();
                    return (
                      <span key={i} className={off ? "text-danger underline" : "text-ink"}>
                        {ch}
                      </span>
                    );
                  })}
                </p>
              )}
            </div>
          )}

          <p className="mt-4 text-center text-sm font-semibold text-ink">
            {resolved} of {total}
            {stars > 0 && <span className="text-amber"> · ⭐ {stars}</span>}
          </p>
        </>
      )}
    </section>
  );
}
