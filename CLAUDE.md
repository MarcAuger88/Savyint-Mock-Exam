# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ Non-standard Next.js

This repo pins `next@16.2.6` — a version with breaking changes vs. the Next.js you may know from training data. **Before writing App Router code, read the relevant guide in `node_modules/next/dist/docs/`** (e.g. `01-app/`) and heed any deprecation notices there. Don't assume APIs/conventions from older Next.js versions still apply.

## Commands

- `npm run dev` — start the dev server (Turbopack via `next dev`)
- `npm run build` — production build
- `npm run start` — run the production build
- `npm run lint` — ESLint (flat config in `eslint.config.mjs`, extends `eslint-config-next` core-web-vitals + typescript)

There is no test suite configured in this project.

### Prisma / database

- The project contains optional database scaffolding, but Prisma is not wired into the app.
- The API routes currently serve local data and stubs; this repo is meant as a local MVP.

## Architecture

This is an MVP for a local Saviynt IGA (Identity Governance & Administration) mock-exam trainer, built with the Next.js App Router, React 19, Tailwind v4, and shadcn/ui (radix-nova style, see `components.json`).

### Data flow — currently fully local/hardcoded

- `lib/exam-data.ts` is the single source of truth for exam content. It defines:
  - `examCategories` / `ExamCategory` — the fixed taxonomy of quiz topics (Access Requests, Certifications, SoD, Workflows, Roles, Lifecycle Management, Connectors, Analytics).
  - `ExamQuestion` type and `examQuestions` — the question bank, built by mapping a `RawExamQuestion[]` bank (which uses an internal `domain` string) through `categoryByDomain` to produce the public `category` field and sequential `id`s.
  - `passingPercentage` (70).
- `app/api/quiz/route.ts` returns `examQuestions` (without `correctAnswer`/`explanation`) as JSON — but **`app/quiz/page.tsx` does not call this API**; it imports `examQuestions` directly from `lib/exam-data` client-side. The API route is effectively unused/vestigial right now.
- `app/api/generate/route.ts` is an intentional stub returning `501` ("AI question generation is not enabled in this MVP"), despite the `openai` package being a dependency — AI-based question generation is planned but not implemented.
- `app/admin/page.tsx` is similarly an intentional "not enabled" placeholder page.

When extending question generation or admin features, decide whether to wire up the existing stubs/Prisma scaffolding or keep extending the local hardcoded approach — don't assume the stubs are dead code to delete without checking with the user, since they signal planned direction.

### Quiz flow (`app/quiz/page.tsx`, client component)

- Picks `examQuestionCount` (10) random questions via `getRandomQuestions`, which also shuffles each question's `choices` — both question order and answer order are randomized per attempt.
- State machine: `currentIndex` / `answers` (map of question id → selected choice) / `isComplete`, with `handleNext`, `handleRetake` driving transitions.
- Renders `ExamProgress` + `QuestionCard` during the exam, and `ResultsSummary` (note: file is `components/ResultsSummary.tsx`, but there's also an unused/legacy `components/ResultSummary.tsx` — check which is actually imported before editing) once complete.

### UI components

- `components/ui/*` are shadcn/ui primitives (button, card, dialog, tabs, radio-group, progress, etc.) generated per `components.json` (style `radix-nova`, base color `neutral`, icon library `lucide`).
- Domain components (`QuestionCard`, `ExamProgress`, `ExamTimer`, `ResultsSummary`) compose these primitives for the quiz experience.
- Path alias `@/*` maps to the project root (see `tsconfig.json` and `components.json` aliases) — import via `@/components/...`, `@/lib/...`, etc.
- Visual style is a dark dashboard theme (`bg-neutral-950`, emerald accent), set up in `app/globals.css` and applied per-page rather than via shared layout chrome (`app/layout.tsx` only sets fonts and base body classes).
