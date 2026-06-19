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

- **Next.js** (App Router) + **React** + **TypeScript**
- **Tailwind CSS v4** for styling
- **NextAuth / Auth.js** for authentication _(added in a later droplet)_
- **Framer Motion** for feedback animations _(added in a later droplet)_
- **Vercel** for deployment

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

## Deployment

The app deploys to **Vercel** with zero configuration:

1. Push to `main` on GitHub (already configured as `origin`).
2. In Vercel, **Import** the `english-quest` repository.
3. Every push to `main` auto-deploys to a public URL.

Environment variables (added as features land) go in Vercel's
**Project → Settings → Environment Variables**. See `.env.example` once auth is
configured.

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
