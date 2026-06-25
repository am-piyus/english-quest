# 🎓 English Quest

> An interactive, gamified English-learning web platform — turning static daily
> worksheets into engaging learning quests with instant feedback, stars, and
> progress tracking.

This is the **V0.1 MVP** built under the Weekly Project methodology
(Sub-Orbit 25.3 → Bucket 25.3.1). The goal is to validate the core learning
experience as fast as possible:

```
Sign in → Open today's lesson → Learn concepts → Complete assignments
        → Get instant feedback → See your session summary → Track progress
```

## Tech stack

- **Next.js** (App Router, **static export**) + **React** + **TypeScript**
- **Tailwind CSS v4** for styling
- **Client-side auth**: demo login + **Google Identity Services** (no backend)
- **Framer Motion** for feedback animations
- **lz-string** for backend-free shareable session links (V0.2)
- **GitHub Pages** for hosting (Vercel-compatible too)

> **Static by design.** The whole app is a static export so it can be hosted on
> GitHub Pages, which has no server. Auth, profile, and progress all live in the
> browser (localStorage). Server-side auth and a real database are V0.2 items for
> when the app moves to a backend host.

## Getting started

```bash
git clone https://github.com/am-piyus/english-quest.git
cd english-quest
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command         | Description                        |
| --------------- | ---------------------------------- |
| `npm run dev`   | Start the local development server |
| `npm run build` | Create a production build          |
| `npm run start` | Run the production build locally   |
| `npm run lint`  | Lint the codebase                  |

## Create & share your own sessions (V0.2)

Beyond the built-in daily lessons, you can **author sessions in the browser** and
**share them as a link** — with no backend.

- **`/create`** — the session builder. Add ordered blocks (revision · concept ·
  assignment · word search) and type the content fresh; drag or use ↑/↓ to
  reorder. Assignments host multiple choice, short answer, **option-bank
  fill-in-the-blank**, and reflection questions. Save locally, or generate a link.
- **Sharing** — "Generate share link" compresses the whole session into the URL
  (`…/play#s=<code>`, via `lz-string`). The link carries its own content, so a
  friend opens it with no server lookup; it's validated on open.
- **`/play`** — the source-agnostic player. It runs a shared session
  (`/play#s=<code>`) or a locally-saved one (`/play?local=<id>`) through the same
  player as the daily lessons. The registry player stays at `/session/[day]`.
- **Word search** — generated **deterministically** from its word list, so
  everyone who opens the same session gets the same puzzle without bloating the link.
- **Results** — finishing any session (daily, shared, or built) records a local,
  session-keyed result (`eq:results:<email>`), ready for a future dashboard.

> Built under Bucket 25.3.3 (Session Authoring & Gamified Blocks). The design and
> constraints live in [`ARCHITECTURE.md`](./ARCHITECTURE.md).

## Deployment

### GitHub Pages (primary)

The repo ships a GitHub Actions workflow (`.github/workflows/deploy.yml`) that
builds the static export and publishes it. One-time setup:

1. On GitHub: **Settings → Pages → Build and deployment → Source = GitHub Actions**.
2. Push to `main`. The workflow builds and deploys automatically.
3. Live at **`https://am-piyus.github.io/english-quest/`**.

To enable "Sign in with Google", add a repository **variable**
`NEXT_PUBLIC_GOOGLE_CLIENT_ID` (Settings → Secrets and variables → Actions →
Variables) — see `.env.example`. Without it, the demo login is used.

### Vercel (optional, later)

Because it's a standard Next.js app, you can **Import** the repo into Vercel for
a zero-config deploy at the domain root (no `basePath`). The static export works
as-is; dropping `output: "export"` later unlocks server features.

## Project status (V0.1 roadmap)

| Droplet  | Feature                           | Status |
| -------- | --------------------------------- | ------ |
| 25.3.1.1 | Project setup & public deployment | ✅     |
| 25.3.1.2 | Google auth & user onboarding     | ⏳     |
| 25.3.1.3 | Gamified dashboard & calendar     | ⏳     |
| 25.3.1.4 | Daily session content engine      | ⏳     |
| 25.3.1.5 | Interactive assignment system     | ⏳     |
| 25.3.1.6 | Instant feedback & gamification   | ⏳     |
| 25.3.1.7 | Session completion & progress     | ⏳     |
| 25.3.1.8 | Day content integration workflow  | ⏳     |

---

_Deferred to V0.2: database persistence, full achievement/badge/XP engine,
instructor portal, CMS, and AI lesson generation._
