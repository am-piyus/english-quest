# ✍️ Content Authoring Guide

How to turn a worksheet or PDF into a live English Quest lesson — **no UI code
required**. Add a JSON file, register one line, deploy.

```
Worksheet / PDF  →  data/dayN.json  →  register in lib/lessonContent.ts  →  deploy
                 →  lesson appears in the calendar automatically
```

## Add a lesson in 4 steps

1. **Copy the template.** Duplicate [`data/day-template.json`](../data/day-template.json)
   to `data/day3.json` (use the next free day number).
2. **Fill in the content.** Set the metadata and write your concepts and
   assignments (fields below). Keep `day` unique.
3. **Register it.** In [`lib/lessonContent.ts`](../lib/lessonContent.ts), import
   the file and add it to the `registered` array:
   ```ts
   import day3 from "@/data/day3.json";
   const registered: unknown[] = [day1, day2, day3];
   ```
4. **Deploy.** Commit and push. The GitHub Actions workflow rebuilds and the new
   lesson shows up in the dashboard calendar, gets its own `/session/3` page, and
   counts toward progress — all automatically.

> Validation runs when lessons load. If a lesson is malformed, it's skipped and
> the reason is printed to the dev/build console (see `lib/contentParser.ts`).
> Run `npm run build` locally to check your lesson before pushing.

## Lesson fields

| Field         | Type     | Required | Notes                                  |
| ------------- | -------- | -------- | -------------------------------------- |
| `day`         | number   | yes      | Unique day number                      |
| `title`       | string   | yes      | Lesson title                           |
| `topic`       | string   | yes      | Grammar topic (shown on cards)         |
| `summary`     | string   | yes      | One-line teaser for the calendar card  |
| `difficulty`  | string   | yes      | `Easy` \| `Medium` \| `Hard`           |
| `durationMin` | number   | yes      | Estimated minutes                      |
| `objectives`  | string[] | yes      | What the learner will be able to do    |
| `intro`       | string   | no       | Friendly intro on the first screen     |
| `sections`    | array    | yes      | Ordered concept + assignment screens   |

## Sections

A lesson is an ordered list of **sections**. Each is either a `concept` or an
`assignment`. They display one screen at a time, in order.

### Concept

```json
{
  "kind": "concept",
  "concept": {
    "title": "He, she, it: add -s",
    "explanation": "Paragraph one.\n\nParagraph two (blank line between).",
    "examples": ["She works.", "He goes."],
    "note": "Optional tip."
  }
}
```

### Assignment

```json
{
  "kind": "assignment",
  "assignment": {
    "title": "Practice",
    "intro": "Optional.",
    "questions": [ /* see below */ ]
  }
}
```

## Question types

| `type`       | Answer field          | Behaviour                                  |
| ------------ | --------------------- | ------------------------------------------ |
| `mcq`        | `options`, `answerIndex` | Single correct choice                   |
| `case`       | `options`, `answerIndex` | Same as mcq (situational wording)       |
| `fill-blank` | `answer`, `alternates?`  | Text match (case/space-insensitive)     |
| `structure`  | `answer`, `alternates?`  | Text match for sentence structure       |
| `reflection` | —                     | Free writing, stored but never graded      |

Common optional fields: `hint` (shown after a wrong attempt), `feedback` (shown
after a correct answer), and `difficulty` (drives the star reward —
Easy = 1, Medium = 2, Hard = 3 stars).

```json
{
  "id": "d3-q1",
  "type": "mcq",
  "prompt": "Choose the correct sentence.",
  "options": ["She go home.", "She goes home.", "She going home."],
  "answerIndex": 1,
  "difficulty": "Easy",
  "hint": "For he/she/it, add -s.",
  "feedback": "She goes home — third person adds -s."
}
```

## Tips

- Give every question a unique `id` (e.g. `d3-q1`).
- For text answers, list common variations in `alternates` (matching ignores
  case, extra spaces, and trailing punctuation).
- Keep lessons short — a few concepts and 4–8 questions works well on mobile.
- End with a `reflection` question to encourage the learner to write.
