"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Difficulty, Lesson, Section } from "@/types/lesson";
import { validateLesson } from "@/lib/contentParser";
import { skeletonJson } from "@/lib/skeletonExport";
import { importLesson } from "@/lib/importLesson";
import {
  saveLocalSession,
  listLocalSessions,
  getLocalLesson,
  deleteLocalSession,
  saveDraft,
  loadDraft,
  clearDraft,
  type LocalSessionMeta,
  type SessionDraft,
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
 * the auth session via /create. Saved sessions are fully manageable (25.3.3.9):
 * each can be edited in place (no duplicate), re-shared, or deleted, and a
 * single in-progress draft is autosaved so half-written work can be resumed.
 */

const DIFFICULTIES: Difficulty[] = ["Easy", "Medium", "Hard"];
const ADD_KINDS: { kind: Section["kind"]; label: string }[] = [
  { kind: "revision", label: "+ Revision" },
  { kind: "concept", label: "+ Concept" },
  { kind: "assignment", label: "+ Assignment" },
  { kind: "wordsearch", label: "+ Word search" },
  { kind: "spell", label: "+ Spelling" },
];

const rowAction =
  "inline-flex min-h-11 items-center gap-1 rounded-full bg-surface px-3 text-xs font-semibold text-ink ring-1 ring-ink/10 transition-colors hover:ring-brand/40";

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
  if (kind === "spell") {
    return {
      kind: "spell",
      spell: {
        title: "",
        level: "Beginner",
        words: [{ word: "" }, { word: "" }, { word: "" }],
      },
    };
  }
  return { kind: "assignment", assignment: { title: "", intro: "", questions: [] } };
}

/** Does the in-progress lesson hold anything worth keeping as a draft? */
function lessonHasContent(l: Lesson): boolean {
  return Boolean(
    l.title ||
      l.topic ||
      l.summary ||
      l.intro ||
      (l.objectives && l.objectives.length) ||
      (l.sections && l.sections.length),
  );
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [locals, setLocals] = useState<LocalSessionMeta[]>([]);
  const [share, setShare] = useState<{ id: string; lesson: Lesson } | null>(null);
  const [pendingDraft, setPendingDraft] = useState<SessionDraft | null>(null);
  const [checkedDraft, setCheckedDraft] = useState(false);

  // AI-assisted authoring (Droplet 25.3.3.13): export a skeleton, paste filled JSON back.
  const [skeletonText, setSkeletonText] = useState<string | null>(null);
  const [skeletonCopied, setSkeletonCopied] = useState(false);
  const [aiPaste, setAiPaste] = useState("");
  const [importRepairs, setImportRepairs] = useState<string[] | null>(null);
  const [importErrors, setImportErrors] = useState<string[]>([]);

  // The form state that was last saved/loaded — used to tell "unsaved changes"
  // from "nothing new", so saving doesn't leave a redundant draft behind. null
  // means "treat everything as unsaved" (a freshly resumed draft).
  const baselineRef = useRef<string | null>(null);

  const lesson: Lesson = useMemo(
    () => ({
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
    }),
    [title, topic, summary, difficulty, durationMin, objectivesText, intro, sections],
  );

  // Raw field signature (untrimmed) — exact, so a load/save baseline matches.
  const formSig = JSON.stringify([
    title,
    topic,
    summary,
    difficulty,
    durationMin,
    objectivesText,
    intro,
    sections,
  ]);

  function hydrate(l: Lesson) {
    setTitle(l.title ?? "");
    setTopic(l.topic ?? "");
    setSummary(l.summary ?? "");
    setDifficulty(l.difficulty ?? "Easy");
    setDurationMin(l.durationMin ?? 10);
    setObjectivesText((l.objectives ?? []).join("\n"));
    setIntro(l.intro ?? "");
    setSections(l.sections ?? []);
  }

  function baselineFor(l: Lesson): string {
    return JSON.stringify([
      l.title ?? "",
      l.topic ?? "",
      l.summary ?? "",
      l.difficulty ?? "Easy",
      l.durationMin ?? 10,
      (l.objectives ?? []).join("\n"),
      l.intro ?? "",
      l.sections ?? [],
    ]);
  }

  // Load the saved-session list + any pending draft once on mount (client-only).
  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      setLocals(listLocalSessions(email));
      const d = loadDraft(email);
      if (d && lessonHasContent(d.lesson)) {
        setPendingDraft(d);
        baselineRef.current = null; // an unsaved draft is dirty until handled
      }
      setCheckedDraft(true);
    });
    return () => {
      active = false;
    };
  }, [email]);

  // Autosave the in-progress draft (after the initial check, and only once any
  // resume/discard decision is made). Clears the draft when there's nothing new.
  useEffect(() => {
    if (!checkedDraft || pendingDraft) return;
    if (!lessonHasContent(lesson)) {
      clearDraft(email);
      return;
    }
    if (baselineRef.current !== null && formSig === baselineRef.current) {
      clearDraft(email);
      return;
    }
    saveDraft(email, lesson, editingId);
  }, [checkedDraft, pendingDraft, email, editingId, lesson, formSig]);

  function addBlock(kind: Section["kind"]) {
    setSections([...sections, newSection(kind)]);
    setSavedId(null);
  }

  // Serialize the current skeleton (with the _ai header) and copy it for an
  // external AI. The textarea is always shown too, so copy works even if the
  // Clipboard API is blocked.
  function exportSkeleton() {
    const json = skeletonJson(lesson);
    setSkeletonText(json);
    setSkeletonCopied(false);
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(json).then(
        () => setSkeletonCopied(true),
        () => setSkeletonCopied(false),
      );
    }
  }

  // Tolerant paste-back: import → load into the builder for review (NOT saved).
  function importFilled() {
    const result = importLesson(aiPaste);
    if ("errors" in result) {
      setImportErrors(result.errors);
      setImportRepairs(null);
      return;
    }
    hydrate(result.lesson);
    setEditingId(null); // an imported draft is a new session until saved
    setSavedId(null);
    setErrors([]);
    setShare(null);
    baselineRef.current = null; // treat as unsaved so it autosaves + Save works
    setImportErrors([]);
    setImportRepairs(result.repairs);
    setAiPaste("");
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function save() {
    const errs = validateLesson(lesson);
    setErrors(errs);
    if (errs.length > 0) {
      setSavedId(null);
      return;
    }
    const id = saveLocalSession(email, lesson, editingId ?? undefined);
    setSavedId(id);
    setEditingId(id);
    setLocals(listLocalSessions(email));
    baselineRef.current = formSig; // current state is now the saved baseline
    clearDraft(email);
  }

  function editSession(id: string) {
    const l = getLocalLesson(email, id);
    if (!l) {
      setLocals(listLocalSessions(email)); // stale row — refresh the list
      return;
    }
    hydrate(l);
    setEditingId(id);
    setSavedId(null);
    setErrors([]);
    setShare(null);
    baselineRef.current = baselineFor(l);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function removeSession(id: string) {
    if (
      typeof window !== "undefined" &&
      !window.confirm("Delete this saved session? This can't be undone.")
    ) {
      return;
    }
    deleteLocalSession(email, id);
    setLocals(listLocalSessions(email));
    if (share?.id === id) setShare(null);
    if (editingId === id) {
      setEditingId(null); // keep the open content, but as a new session
      setSavedId(null);
      baselineRef.current = null;
    }
  }

  function toggleShare(id: string) {
    if (share?.id === id) {
      setShare(null);
      return;
    }
    const l = getLocalLesson(email, id);
    if (l) setShare({ id, lesson: l });
    else setLocals(listLocalSessions(email));
  }

  function startNew() {
    setTitle("");
    setTopic("");
    setSummary("");
    setDifficulty("Easy");
    setDurationMin(10);
    setObjectivesText("");
    setIntro("");
    setSections([]);
    setEditingId(null);
    setSavedId(null);
    setErrors([]);
    setShare(null);
    baselineRef.current = null;
  }

  function resumeDraft() {
    if (!pendingDraft) return;
    hydrate(pendingDraft.lesson);
    setEditingId(pendingDraft.editingId);
    setSavedId(null);
    setErrors([]);
    baselineRef.current = null; // resumed work stays an active draft until saved
    setPendingDraft(null);
  }

  function discardDraft() {
    clearDraft(email);
    setPendingDraft(null);
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

      {pendingDraft && (
        <div className="eq-card mt-4 border-l-4 border-brand p-4">
          <p className="text-sm font-semibold text-ink">
            You have an unsaved draft
            {pendingDraft.editingId ? " of a saved session" : ""}.
          </p>
          <p className="mt-1 text-sm text-ink-soft">
            Pick up where you left off, or discard it and start fresh.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={resumeDraft}
              className="eq-btn eq-btn-primary px-4 py-2.5 text-sm"
            >
              Resume draft
            </button>
            <button
              type="button"
              onClick={discardDraft}
              className="eq-btn eq-btn-ghost px-4 py-2.5 text-sm"
            >
              Discard
            </button>
          </div>
        </div>
      )}

      <div className="mt-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">
            {editingId ? "Edit session" : "Create a session"}
          </h1>
          <p className="mt-1 text-ink-soft">
            {editingId
              ? "Update this session — saving overwrites it (no duplicate)."
              : "Assemble blocks, type the content, then save it or share a link."}
          </p>
        </div>
        {editingId && (
          <button
            type="button"
            onClick={startNew}
            className="shrink-0 text-sm font-semibold text-brand-dark hover:underline"
          >
            + New
          </button>
        )}
      </div>

      {/* AI-assisted authoring: skeleton out → fill in any AI → paste back. */}
      <section className="eq-card mt-6 space-y-3 p-5">
        <div>
          <h2 className="text-base font-bold text-ink">✨ Draft with AI</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Build an empty skeleton below (blocks + question counts), export it,
            fill it in any AI for your topic, then paste it back here. The AI
            never sees your account — it runs outside the app.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={exportSkeleton}
            className="eq-btn eq-btn-ghost px-4 py-2.5 text-sm"
          >
            ⬇️ Export skeleton for AI
          </button>
          {skeletonText && (
            <span className="text-xs font-semibold text-success">
              {skeletonCopied ? "Copied to clipboard ✓" : "Ready — select & copy below"}
            </span>
          )}
        </div>

        {skeletonText && (
          <textarea
            readOnly
            value={skeletonText}
            onFocus={(e) => e.currentTarget.select()}
            rows={5}
            className={`${fieldClass} font-mono text-xs`}
            aria-label="Skeleton JSON to copy into an AI"
          />
        )}

        <div className="border-t border-ink/10 pt-3">
          <TextArea
            label="Paste filled session JSON"
            value={aiPaste}
            onChange={setAiPaste}
            rows={4}
            placeholder='Paste the completed JSON the AI returned, then tap Import…'
          />
          <button
            type="button"
            onClick={importFilled}
            disabled={aiPaste.trim() === ""}
            className="eq-btn eq-btn-primary mt-2 px-4 py-2.5 text-sm"
          >
            Import for review
          </button>

          {importErrors.length > 0 && (
            <div className="mt-3 rounded-2xl border border-danger/30 bg-danger-soft p-3">
              <p className="text-sm font-semibold text-danger">
                Couldn&apos;t import — nothing was changed:
              </p>
              <ul className="mt-1 list-disc pl-5 text-sm text-danger">
                {importErrors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          )}

          {importRepairs && (
            <div className="mt-3 rounded-2xl border border-success/30 bg-success-soft p-3 text-sm text-ink">
              <p className="font-semibold text-success">
                Imported into the builder for review ✓
              </p>
              {importRepairs.length > 0 ? (
                <>
                  <p className="mt-1">Auto-fixed {importRepairs.length}:</p>
                  <ul className="mt-1 list-disc pl-5 text-ink-soft">
                    {importRepairs.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="mt-1 text-ink-soft">No fixes needed.</p>
              )}
              <p className="mt-2 text-ink-soft">
                Review and edit below, then Save — nothing is saved until you do.
              </p>
            </div>
          )}
        </div>
      </section>

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
          {editingId ? "Save changes" : "Save session"}
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
            <p className="font-semibold text-success">
              {editingId ? "Changes saved ✓" : "Saved on this device ✓"}
            </p>
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
              <li key={m.id} className="rounded-2xl bg-paper-2 p-3">
                <p className="truncate text-sm font-semibold text-ink">
                  {m.title || "Untitled session"}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Link href={`/play?local=${m.id}`} className={rowAction}>
                    ▶ Open
                  </Link>
                  <button
                    type="button"
                    onClick={() => editSession(m.id)}
                    className={rowAction}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleShare(m.id)}
                    aria-expanded={share?.id === m.id}
                    className={rowAction}
                  >
                    🔗 Share
                  </button>
                  <button
                    type="button"
                    onClick={() => removeSession(m.id)}
                    className={`${rowAction} text-danger ring-danger/30 hover:bg-danger-soft hover:ring-danger/50`}
                  >
                    🗑 Delete
                  </button>
                </div>
                {share?.id === m.id && (
                  <div className="mt-3">
                    <ShareLinkPanel lesson={share.lesson} auto />
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
