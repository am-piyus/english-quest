"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Difficulty, Lesson, Section } from "@/types/lesson";
import { validateLesson } from "@/lib/contentParser";
import {
  saveLocalSession,
  listLocalSessions,
  type LocalSessionMeta,
} from "@/lib/customSessions";
import ThemeToggle from "@/components/ThemeToggle";
import BlockList from "@/components/builder/BlockList";
import ShareLinkPanel from "@/components/builder/ShareLinkPanel";
import {
  TextField,
  TextArea,
  Labeled,
  fieldClass,
} from "@/components/builder/fields";

/**
 * Session builder (Droplet 25.3.3.4). Owns the in-progress Lesson, assembles
 * blocks, and on save runs the assembled object through validateLesson (the
 * single gate — zero new validation logic) before saveLocalSession. Custom
 * sessions use day 0 (a sentinel; they play via /play, not /session/[day]).
 *
 * Saves are scoped to the signed-in user (Droplet 25.3.3.8): `email` comes from
 * the auth session via /create, so "Your saved sessions" is per-user.
 */

const DIFFICULTIES: Difficulty[] = ["Easy", "Medium", "Hard"];
const ADD_KINDS: { kind: Section["kind"]; label: string }[] = [
  { kind: "revision", label: "+ Revision" },
  { kind: "concept", label: "+ Concept" },
  { kind: "assignment", label: "+ Assignment" },
  { kind: "wordsearch", label: "+ Word search" },
];

function newSection(kind: Section["kind"]): Section {
  if (kind === "revision") {
    return { kind: "revision", revision: { title: "", summary: "" } };
  }
  if (kind === "concept") {
    return {
      kind: "concept",
      concept: { title: "", explanation: "", examples: [], note: "" },
    };
  }
  if (kind === "wordsearch") {
    return {
      kind: "wordsearch",
      wordsearch: { title: "", words: ["", "", "", "", ""], gridSize: 15 },
    };
  }
  return { kind: "assignment", assignment: { title: "", intro: "", questions: [] } };
}

export default function SessionBuilder({ email }: { email: string }) {
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [summary, setSummary] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("Easy");
  const [durationMin, setDurationMin] = useState(10);
  const [objectivesText, setObjectivesText] = useState("");
  const [intro, setIntro] = useState("");
  const [sections, setSections] = useState<Section[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [locals, setLocals] = useState<LocalSessionMeta[]>([]);

  useEffect(() => {
    // localStorage is client-only → load after mount, in a microtask so we don't
    // set state synchronously during the effect.
    let active = true;
    Promise.resolve().then(() => {
      if (active) setLocals(listLocalSessions(email));
    });
    return () => {
      active = false;
    };
  }, [email]);

  const lesson: Lesson = {
    day: 0,
    title: title.trim(),
    topic: topic.trim(),
    summary: summary.trim(),
    difficulty,
    durationMin,
    objectives: objectivesText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean),
    intro: intro.trim() || undefined,
    sections,
  };

  function addBlock(kind: Section["kind"]) {
    setSections([...sections, newSection(kind)]);
    setSavedId(null);
  }

  function save() {
    const errs = validateLesson(lesson);
    setErrors(errs);
    if (errs.length > 0) {
      setSavedId(null);
      return;
    }
    const id = saveLocalSession(email, lesson);
    setSavedId(id);
    setLocals(listLocalSessions(email));
  }

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-5 py-8 sm:px-6">
      <header className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="-ml-2 inline-flex min-h-[44px] items-center px-2 text-sm font-semibold text-brand-dark hover:underline"
        >
          ← Dashboard
        </Link>
        <ThemeToggle />
      </header>

      <h1 className="mt-4 text-2xl font-extrabold text-ink">Create a session</h1>
      <p className="mt-1 text-ink-soft">
        Assemble blocks, type the content, then save it or share a link.
      </p>

      {/* Session metadata */}
      <section className="eq-card mt-6 space-y-3 p-5">
        <TextField
          label="Title"
          value={title}
          onChange={setTitle}
          placeholder="Present simple practice"
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField label="Topic" value={topic} onChange={setTopic} placeholder="Grammar" />
          <Labeled label="Difficulty">
            <select
              className={fieldClass}
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Difficulty)}
            >
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </Labeled>
        </div>
        <TextField
          label="One-line summary"
          value={summary}
          onChange={setSummary}
          placeholder="Habits, routines and general facts."
        />
        <Labeled label="Estimated minutes">
          <input
            type="number"
            min={1}
            className={fieldClass}
            value={durationMin}
            onChange={(e) =>
              setDurationMin(Math.max(1, Number(e.target.value) || 1))
            }
          />
        </Labeled>
        <TextArea
          label="Objectives (one per line)"
          value={objectivesText}
          onChange={setObjectivesText}
          placeholder={"Use -s for he/she/it\nForm simple present questions"}
        />
        <TextField
          label="Intro (optional)"
          value={intro}
          onChange={setIntro}
          placeholder="A friendly opening line"
        />
      </section>

      {/* Blocks */}
      <section className="mt-6">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink-soft">
          Blocks
        </h2>
        <BlockList
          sections={sections}
          onChange={(s) => {
            setSections(s);
            setSavedId(null);
          }}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {ADD_KINDS.map((k) => (
            <button
              key={k.kind}
              type="button"
              onClick={() => addBlock(k.kind)}
              className="rounded-full bg-brand-soft px-3 py-1.5 text-sm font-semibold text-brand-dark hover:brightness-105"
            >
              {k.label}
            </button>
          ))}
        </div>
      </section>

      {/* Save + share */}
      <section className="eq-card mt-6 space-y-3 p-5">
        <button
          type="button"
          onClick={save}
          className="eq-btn eq-btn-primary w-full sm:w-auto"
        >
          Save session
        </button>

        {errors.length > 0 && (
          <div className="rounded-2xl border border-danger/30 bg-danger-soft p-3">
            <p className="text-sm font-semibold text-danger">
              Fix these before saving:
            </p>
            <ul className="mt-1 list-disc pl-5 text-sm text-danger">
              {errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </div>
        )}

        {savedId && (
          <div className="rounded-2xl border border-success/30 bg-success-soft p-3 text-sm text-ink">
            <p className="font-semibold text-success">Saved on this device ✓</p>
            <p className="mt-1">
              Play it now:{" "}
              <Link
                href={`/play?local=${savedId}`}
                className="font-semibold text-brand-dark hover:underline"
              >
                open the session →
              </Link>
            </p>
          </div>
        )}

        <ShareLinkPanel lesson={lesson} />
      </section>

      {/* Saved sessions on this device */}
      {locals.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink-soft">
            Your saved sessions
          </h2>
          <ul className="space-y-2">
            {locals.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between gap-2 rounded-2xl bg-paper-2 px-4 py-3"
              >
                <span className="truncate text-sm font-semibold text-ink">
                  {m.title}
                </span>
                <Link
                  href={`/play?local=${m.id}`}
                  className="shrink-0 text-sm font-semibold text-brand-dark hover:underline"
                >
                  Open →
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
