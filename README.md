<div align="center">
  <img src="public/evalio.svg" alt="Evalio" width="96" height="96" />
  <h1>Evalio</h1>
  <p><b>The AI hackathon jury</b> — organiser console, live leaderboard and evidence-backed project reports.</p>
  <p>
    <img alt="Next.js" src="https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=nextdotjs&logoColor=white" />
    <img alt="React" src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" />
    <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white" />
    <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" />
    <img alt="Motion" src="https://img.shields.io/badge/Motion-13-FFD23F?style=flat-square&logo=framer&logoColor=black" />
    <img alt="TanStack Query" src="https://img.shields.io/badge/TanStack%20Query-5-FF4154?style=flat-square&logo=reactquery&logoColor=white" />
  </p>
  <sub>Backend: <a href="https://github.com/0nlyDevs/EVALIO--BACKEND">EVALIO--BACKEND</a> (FastAPI · PostgreSQL · ChromaDB)</sub>
</div>

---

<p align="center">
  <img src="docs/screenshots/project-report.png" alt="Evalio project report: score dial, head-judge verdict, Code/Market/Product judge scores and the jury chat" width="900" />
</p>

## What you get

| Screen | Highlights |
|---|---|
| **Landing** `/` | What the jury checks, how it works — animated hero verdict, scroll reveals |
| **Console** `/dashboard` | Hackathons with phase, submissions, judged %, top score · create with **weighted criteria** routed to judges |
| **Hackathon** `/hackathon/[id]` | Criteria-weight bar · animated **podium** · ranked table (per-judge scores, criteria sparkline, flags) · filterable submissions · open/close submissions |
| **Report** `/project/[id]` | Score dial & head-judge verdict · live **pipeline tracker** while judging · scorecard with rationale + file evidence · Code / Market / Product reports · integrity flags · chat with the jury (cites files) · re-run, review, delete |
| **Search** `/search` | Semantic search across all submissions with match % |

Data refreshes automatically while evaluations run (`POLLING_INTERVAL_MS`) and stops once the jury is done.

## Design

Elevated neo-brutalism: warm paper background, 2px ink borders, hard offset shadows, Space Grotesk + JetBrains Mono.
One color per judge — <kbd>Code</kbd> sky · <kbd>Market</kbd> mint · <kbd>Product</kbd> violet. Motion via `motion/react`
(springs, staggered reveals, count-ups) and fully disabled under `prefers-reduced-motion`. Tokens live in `src/app/globals.css`.

## Quick start

```bash
cp .env.example .env.local     # NEXT_PUBLIC_API_URL=http://localhost:8000/api
npm install
npm run dev                    # http://localhost:3000
```

## Structure

```
src/app/                 routes (landing, dashboard, hackathon/[id], project/[id], search)
src/components/          Topbar, cards, modals, Leaderboard, PipelineTracker, ChatInterface
src/components/report/   scorecard + Code / Market / Product judge panels
src/components/ui/       shadcn primitives (select, calendar…)
src/lib/api.ts           typed API client
src/lib/hooks/           TanStack Query hooks (polling, mutations, chat, search)
```
