# English Quest — Architecture (V0.1 → V0.2)

> Source of truth for Bucket 25.3.3 (Session Authoring & Gamified Blocks).
> Read this fully before changing code. It describes what exists, what is being
> added, and the constraints that any new code must respect.

---

## 1. Purpose & scope

English Quest is a gamified daily English-practice web app: a ~10-minute habit
loop a learner does and shares with friends. It is a **static front-end only**
app — no backend, no database, no server functions. State lives in the browser
(`localStorage`).

**V0.2 (this bucket) adds three things and nothing else:**

1. **Runtime-authored sessions** — a user builds a session in the browser
   (title + ordered blocks + typed content) instead of editing JSON files.
2. **Shareable sessions** — a session travels in a link, with no backend.
3. **Gamified block types** — assignments beyond multiple choice, so a session
   feels like a game rather than a form.

Everything else (auth, dashboard, theming, gamification, the player) already
works and must keep working. **V0.2 is additive, not a rewrite.**

---

## 2. Platform constraints (read before designing anything)

| Constraint | Source | What it forces |
|---|---|---|
| Static export (`output: "export"`) | `next.config.ts` | No server code. Every route is pre-rendered to HTML at build time. |
| Dynamic routes need `generateStaticParams` | Next.js static export | `app/session/[day]` is pre-generated from the registry. It **cannot** render a session whose ID isn't known at build time. |
| Hosted under a base path (`/english-quest`) | GitHub Pages project site | `next.config.ts` sets `basePath`/`assetPrefix`. Any generated link must include the base path. |
| No backend | Product decision | A shared session must carry its **own content** — there is no server to look it up from. |
| `localStorage` only | Product decision | Per-device storage. A user can see **their own** results; cross-device sharing of results needs a future backend. |

**The load-bearing consequence:** runtime sessions (built or shared) get a
**separate static route** that decodes the session client-side. The registry
player at `/session/[day]` stays exactly as it is.

---

## 3. Core domain model — "blocks"

A session is an ordered list of **blocks**. In code the type is `Section`
(in `types/lesson.ts`); "block" is the user-facing word. The block model
already exists — V0.2 extends its unions, it does not replace them.

Today:

```
Lesson
 ├─ metadata (day, title, topic, summary, difficulty, durationMin, objectives)
 └─ sections: Section[]            // the ordered blocks
      ├─ { kind: "concept";    concept: Concept }
      └─ { kind: "assignment"; assignment: Assignment }

Assignment
 └─ questions: Question[]
      ├─ ChoiceQuestion     ("mcq" | "case")        // option index answer
      ├─ TextQuestion       ("fill-blank" | "structure")  // exact/alt text answer
      └─ ReflectionQuestion ("reflection")          // stored, never graded
```

V0.2 adds, **without removing or renaming any of the above**:

- a new `Section` kind: **`revision`** (Block 1 — optional recap)
- a new `Question` type: **`option-bank`** (dash-fill from an option bank)
- a new `Section` kind: **`wordsearch`** (a generated puzzle block)

Word search is a **block**, not a question, because it is not a prompt with one
answer — it is a generated grid the learner solves. So it sits at the `Section`
level next to `concept`/`assignment`, not inside `Assignment.questions`.

Proposed type extensions (the exact shapes Claude Code should implement;
keep them in `types/lesson.ts`):

```ts
// --- new block: revision ----------------------------------------------------
export interface Revision {
  title?: string;
  summary: string;     // short recap text (paragraphs separated by blank lines)
  refDay?: number;     // optional: the earlier day this revises
}

// --- new question: option-bank (dash-fill from options) ---------------------
export interface OptionBankQuestion {
  id: string;
  type: "option-bank";
  prompt?: string;
  options: string[];                       // the bank, e.g. 5 options
  items: { text: string; answer: number }[]; // each sentence has ONE blank "___";
                                             // answer = index into options
  hint?: string;
  feedback?: string;
  difficulty?: Difficulty;
}

// --- new block: word search -------------------------------------------------
export interface WordSearch {
  title?: string;
  words: string[];     // builder default = 5
  gridSize: number;    // MVP fixed = 15 (configurable in a later iteration)
}

// --- union extensions -------------------------------------------------------
export type Question =
  | ChoiceQuestion
  | TextQuestion
  | ReflectionQuestion
  | OptionBankQuestion;        // NEW

export type Section =
  | { kind: "concept";    concept: Concept }
  | { kind: "assignment"; assignment: Assignment }
  | { kind: "revision";   revision: Revision }      // NEW
  | { kind: "wordsearch"; wordsearch: WordSearch }; // NEW
```

Because these are discriminated unions, the renderer and the validator switch on
`kind`/`type`; adding a case is the whole change for the player to support a new
block. This is *why* the foundation is good — the player already walks
`sections` and renders per `kind`.

---

## 4. V0.1 architecture (current)

Layered, and already modular:

```
types/      domain contracts (the block model lives here)
data/       lesson content as JSON + a registry that wires it in
lib/        pure logic: engines, persistence, auth, hooks
components/  presentation: per-block renderers, per-question renderers, screens
app/        Next.js routes (thin; compose components + lib)
```

**Data flow (registry session):**

```
data/dayN.json
  → lib/lessonContent.ts   (registry: imports + validates each lesson)
  → lib/lessons.ts         (derives LessonMeta for dashboard/calendar)
  → app/session/[day]/page.tsx   (generateStaticParams from registry)
  → components/SessionScreen.tsx (walks lesson.sections, renders per kind)
  → lib engines (scoring / reward / gamification / progress / statistics)
  → lib/storage.ts         (localStorage)
```

**lib responsibilities (by file):**

| File | Responsibility |
|---|---|
| `lessonContent.ts` | Lesson registry: imports `dayN.json`, validates, exposes `getAllLessons` / `getLesson` / `hasLesson`. The single place lessons are wired in. |
| `lessons.ts` | Derives `LessonMeta` (dashboard/calendar/session listing) from the registry. |
| `contentParser.ts` | `validateLesson` + content parsing. The shared validity gate. |
| `answerValidator.ts` | Validates free-text answers (exact / alternates). |
| `scoringEngine.ts` | Scores answers and assignments. |
| `rewardEngine.ts` | Computes rewards (stars). |
| `gamificationEngine.ts` | Streaks / achievements logic. |
| `statisticsEngine.ts` | Aggregate stats. |
| `session.ts` / `sessionTracker.ts` | Session run model + run-state tracking. |
| `progress.ts` | Progress persistence model (the heaviest module). |
| `storage.ts` | Namespaced `localStorage` read/write wrapper. |
| `googleAuth.ts` | Google OAuth sign-in. |
| `userProfile.ts` | User profile model. |
| `funnelDraft.ts` | Funnel draft state (Bucket 25.3.2 work). |
| `exportData.ts` | Export user data. |
| `theme.ts` | Theme state. |
| Hooks | `useSession`, `useProgress`, `useProfile`, `useTheme`, `useCorruption`. |

**components — already split the way V0.2 needs:**

- Per-block renderers: `ConceptCard.tsx`, `AssignmentBlock.tsx`
- Per-question renderers: `MCQQuestion.tsx`, `TextQuestion.tsx`, `QuestionCard.tsx`
- Screens: `SessionScreen.tsx` (player), `SessionSummary.tsx`, `Dashboard.tsx`
- Funnel: `WelcomeFunnel.tsx`, `FunnelLogin.tsx`
- Gamification: `AchievementPopup.tsx`, `StarReward.tsx`, `StreakCard.tsx`, `ProgressBar.tsx`

The pattern is clear: **one renderer per block kind, one per question type.**
V0.2 follows it — add `RevisionBlock.tsx`, `OptionBankQuestion.tsx`,
`WordSearchBlock.tsx`, and a `components/builder/` folder.

---

## 5. Current file tree

```
english-quest/
├── .env.example
├── .github/                     # GitHub Pages deploy workflow
├── AGENTS.md
├── CLAUDE.md
├── README.md
├── app/
│   ├── layout.tsx
│   ├── globals.css
│   ├── page.tsx                 # landing / intro
│   ├── login/page.tsx
│   ├── welcome/page.tsx
│   ├── onboarding/page.tsx
│   ├── dashboard/page.tsx
│   ├── session/[day]/page.tsx   # registry player (static-generated per day)
│   └── session-complete/page.tsx
├── components/
│   ├── ConceptCard.tsx
│   ├── AssignmentBlock.tsx
│   ├── MCQQuestion.tsx
│   ├── TextQuestion.tsx
│   ├── QuestionCard.tsx
│   ├── SessionScreen.tsx        # the player: walks sections, renders per kind
│   ├── SessionSummary.tsx
│   ├── SessionProgress.tsx
│   ├── Dashboard.tsx
│   ├── LearningCalendar.tsx
│   ├── TodayLessonCard.tsx
│   ├── LessonHeader.tsx
│   ├── LessonNavigator.tsx
│   ├── WelcomeFunnel.tsx
│   ├── FunnelLogin.tsx
│   ├── LoginButton.tsx / LogoutButton.tsx / RequireAuth.tsx
│   ├── OnboardingForm.tsx
│   ├── UserProfileCard.tsx
│   ├── AchievementPopup.tsx / StarReward.tsx / StreakCard.tsx
│   ├── ProgressBar.tsx / ProgressCard.tsx
│   ├── ThemeToggle.tsx
│   ├── ExampleCard.tsx / ExportDataButton.tsx
│   └── DataIntegrity.tsx / CorruptionNotice.tsx
├── data/
│   ├── day-template.json        # copy this to author a new lesson
│   ├── day1.json
│   └── day2.json
├── docs/
│   └── content-authoring-guide.md
├── lib/
│   ├── lessonContent.ts / lessons.ts
│   ├── contentParser.ts / answerValidator.ts
│   ├── scoringEngine.ts / rewardEngine.ts / gamificationEngine.ts / statisticsEngine.ts
│   ├── session.ts / sessionTracker.ts / progress.ts / storage.ts
│   ├── googleAuth.ts / userProfile.ts / funnelDraft.ts / exportData.ts / theme.ts
│   └── useSession.ts / useProgress.ts / useProfile.ts / useTheme.ts / useCorruption.ts
├── types/
│   ├── lesson.ts                # the block model
│   ├── question.ts
│   └── google.d.ts
├── public/
├── next.config.ts               # output: export, basePath
├── eslint.config.mjs / postcss.config.mjs
├── tsconfig.json
└── package.json / package-lock.json
```

---

## 6. V0.2 design (new)

### 6.1 Session source abstraction

Introduce one resolver so the player never cares where a session came from:

```
lib/customSessions.ts
  loadSession(source): Lesson | null
    - source = { kind: "registry"; day }   → lib/lessonContent.getLesson(day)
    - source = { kind: "shared";   code }   → lib/shareLink.decode(code)
    - source = { kind: "local";    id }     → read from localStorage
  saveLocalSession(lesson): id
  listLocalSessions(): {id, title}[]
```

- `/session/[day]` keeps using the registry directly (static-generated).
- A **new** `/play` route (single static page) reads `window.location.hash`
  (`#s=<code>` shared link) or a `?local=<id>` query and calls `loadSession`,
  then renders the **same** `SessionScreen`. Hash is client-only, so GitHub
  Pages routing/base-path is not an issue.

`SessionScreen` is fed a `Lesson` and is otherwise unchanged.

### 6.2 Share link engine

```
lib/shareLink.ts
  encode(lesson): string   // JSON → LZ-string compressToEncodedURIComponent
  decode(code): Lesson      // reverse; then validateLesson(); throw on invalid
```

- Use **`lz-string`** (the only new dependency this bucket should add).
- Link shape: `<basePath>/play#s=<code>` — build it via the Next base path,
  never a hardcoded origin.
- **Size budget:** keep the typed content lean; a typical session compresses to
  well under common URL limits, but the builder should warn if a session is
  unusually large rather than emit a broken link.
- `decode` must **never trust** the payload — run it through `validateLesson`
  before play, and fail with a clear message on a corrupt/oversized link.

### 6.3 Gamified blocks

- **Option-bank (dash-fill):** `components/OptionBankQuestion.tsx`. Render the
  option bank + each sentence with its blank; learner taps an option into a
  blank; score by comparing chosen index to `items[].answer`. Scoring plugs into
  `scoringEngine.ts` (add an `option-bank` branch).
- **Word search:** `components/WordSearchBlock.tsx` + `lib/wordSearch.ts`.
  - `lib/wordSearch.ts` generates a `gridSize × gridSize` grid from `words`.
  - **The generator must be deterministic** (seed it from the word list) so both
    friends opening the same shared session see the **same** grid without baking
    the grid into the link (keeps links small). No `Math.random()` without a
    seed.
  - Interaction: drag/tap to select a run of letters; match against placed words;
    score found words. Plug scoring into `scoringEngine.ts`.

### 6.4 Builder

```
app/create/page.tsx              # the /create route
components/builder/
  SessionBuilder.tsx             # owns the in-progress Lesson state
  BlockList.tsx                  # ordered list, add / reorder / delete
  ShareLinkPanel.tsx             # "generate link" → shareLink.encode → copy
  blockEditors/
    RevisionEditor.tsx
    ConceptEditor.tsx
    AssignmentEditor.tsx         # hosts MCQ / short-answer / reflection / option-bank
    OptionBankEditor.tsx
    WordSearchEditor.tsx
```

- The builder's only job is to assemble a **valid `Lesson` object**. It must run
  the result through `validateLesson` before saving or sharing — so there is
  **zero new validation logic**, the existing gate is reused.
- Content is typed fresh (no block library in MVP). Reorder via drag.
- "Generate link" calls `shareLink.encode` and shows a copyable
  `<basePath>/play#s=…` link.

### 6.5 Result logging

- Reuse `progress.ts` / `sessionTracker.ts`. Ensure completion + per-assignment
  results are written **keyed to the session id** (registry day, shared-session
  hash digest, or local id) so custom/shared sessions log just like registry
  ones. Structure the record so a future dashboard can read it. **Local only** —
  each player records their own results.

---

## 7. Expected file tree after the bucket

`[NEW]` = created this bucket · `[MOD]` = modified this bucket · everything else unchanged.

```
english-quest/
├── ARCHITECTURE.md                         [NEW]  this file
├── app/
│   ├── create/page.tsx                     [NEW]  builder route (25.3.3.4)
│   ├── play/page.tsx                       [NEW]  source-agnostic player (25.3.3.3)
│   └── session/[day]/page.tsx              (unchanged — registry player)
├── components/
│   ├── RevisionBlock.tsx                   [NEW]  (25.3.3.1)
│   ├── OptionBankQuestion.tsx              [NEW]  (25.3.3.5)
│   ├── WordSearchBlock.tsx                 [NEW]  (25.3.3.6)
│   ├── SessionScreen.tsx                   [MOD]  render "revision" + "wordsearch" kinds
│   └── builder/                            [NEW]  (25.3.3.4)
│       ├── SessionBuilder.tsx
│       ├── BlockList.tsx
│       ├── ShareLinkPanel.tsx
│       └── blockEditors/
│           ├── RevisionEditor.tsx
│           ├── ConceptEditor.tsx
│           ├── AssignmentEditor.tsx
│           ├── OptionBankEditor.tsx
│           └── WordSearchEditor.tsx
├── lib/
│   ├── shareLink.ts                        [NEW]  encode/decode (25.3.3.2)
│   ├── customSessions.ts                   [NEW]  loadSession resolver + local store (25.3.3.3)
│   ├── wordSearch.ts                       [NEW]  deterministic grid generator (25.3.3.6)
│   └── scoringEngine.ts                    [MOD]  score option-bank + word search
├── types/
│   └── lesson.ts                           [MOD]  +revision +option-bank +wordsearch
├── data/
│   └── day-template.json                   [MOD, optional] add example new blocks
└── package.json                            [MOD]  + lz-string
```

No existing file is deleted or renamed. New surface area is contained to a
handful of new modules plus a `builder/` folder.

---

## 8. Droplet → files map

| Droplet | Touches | Done when |
|---|---|---|
| **25.3.3.1** Revision block | `types/lesson.ts` [MOD], `components/RevisionBlock.tsx` [NEW], `components/SessionScreen.tsx` [MOD] | day1/day2 still play; a lesson with a revision block renders |
| **25.3.3.2** Share link engine | `lib/shareLink.ts` [NEW], `package.json` [MOD, +lz-string] | encode→decode round-trips a lesson; invalid link fails cleanly |
| **25.3.3.3** Source-agnostic player | `lib/customSessions.ts` [NEW], `app/play/page.tsx` [NEW] | same player runs registry / shared-link / local sessions |
| **25.3.3.4** Builder | `app/create/page.tsx` [NEW], `components/builder/**` [NEW] | build a full Day 1 session in-browser; output passes `validateLesson` |
| **25.3.3.5** Option-bank block | `types/lesson.ts` [MOD], `components/OptionBankQuestion.tsx` [NEW], `lib/scoringEngine.ts` [MOD], `OptionBankEditor.tsx` [NEW] | learner fills blanks from bank; scored; creatable in builder |
| **25.3.3.6** Word search block | `types/lesson.ts` [MOD], `lib/wordSearch.ts` [NEW], `components/WordSearchBlock.tsx` [NEW], `lib/scoringEngine.ts` [MOD], `WordSearchEditor.tsx` [NEW] | 15×15 puzzle generates deterministically; words found + scored; creatable in builder |
| **25.3.3.7** Handoff + logging | `components/builder/ShareLinkPanel.tsx` [MOD], `lib/progress.ts` / `sessionTracker.ts` [MOD] | build→link in one step; completion logged locally per session |

---

## 9. Cross-cutting principles & future evolution

**Modularity rules for this bucket**

- One module = one responsibility. New block kinds get their own renderer file
  and (if needed) one lib helper — never bolted into an unrelated engine.
- Switch on `kind`/`type` to extend; do not add booleans/flags that special-case
  one block inside another.
- Reuse `validateLesson` as the single validity gate everywhere a `Lesson` is
  produced (registry, builder, decoded link).
- No hardcoded origins or paths — derive links from the Next base path.
- No new dependencies except `lz-string`. Anything else: stop and ask.

**Designed-for-later (do NOT build now, but don't block them either)**

- Backend sync for cross-device shared results (the only thing localStorage
  can't do). The result record shape should be JSON-serialisable and
  session-keyed so it can later sync as-is.
- Configurable word-search (grid size, word count) — `WordSearch` already
  carries `gridSize`/`words`, so this is a builder-UI change later, not a model
  change.
- Sub-assignment blocks (mixed exercise types inside one assignment) —
  `Assignment.questions[]` already allows mixed `Question` types.
- Behaviour-driven adaptation (observe users, deliver better) — a later analytics
  layer reading the logged result records.

The guiding test for every change: *would a future maintainer (or a future
agent) be able to add the next block type by adding one file and one `case`?*
If yes, the architecture held.
