# Saviynt IGA Exam Trainer

A local Next.js mock exam trainer for Saviynt IGA concepts.

## Overview

- `app/page.tsx` is the landing page for selecting exam categories and question count.
- `app/quiz/page.tsx` loads the quiz interface via `components/QuizClient.tsx`.
- `lib/exam-data.ts` contains the local question bank and exports `examQuestions`.
- `lib/exam-generator.ts` builds quiz question sets with difficulty balancing.
- `lib/question-validator.ts` performs question bank validation.
- `app/api/quiz/route.ts` exposes a quiz API endpoint, but the UI currently loads content directly.
- AI question generation is not included in this release.

## Project structure

- `app/` — App Router pages and API routes
- `components/` — UI components for the quiz flow
- `components/ui/` — shadcn UI primitives
- `lib/` — question generation, loading, and validation logic
- `types/` — shared TypeScript exam types

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
npm test
npm run test:e2e
```

## Docker

Build and run the production container:

```bash
docker build -t saviynt-exam-trainer .
docker run --rm -p 3000:3000 -v saviynt-exam-data:/app/data saviynt-exam-trainer
```

Then open `http://localhost:3000`.

Or use Docker Compose:

```bash
docker compose up --build
```

If Docker Desktop looks stuck during the build, run this for more detailed output:

```bash
docker compose --progress=plain build
```

The Dockerfile uses Node 22 because `better-sqlite3` has a compatible prebuilt
binary there. Node 20 can fall back to compiling SQLite from source, which is
much slower.

The container stores quiz attempt history in SQLite at `/app/data/quiz-attempts.sqlite`.
The included Compose file mounts that path to a named volume, so attempts persist across
container restarts.

To share the image with another environment:

```bash
docker build -t saviynt-exam-trainer:latest .
docker save saviynt-exam-trainer:latest -o saviynt-exam-trainer.tar
```

On the target machine:

```bash
docker load -i saviynt-exam-trainer.tar
docker run --rm -p 3000:3000 -v saviynt-exam-data:/app/data saviynt-exam-trainer:latest
```

## Notes

- This MVP uses a fully local question bank.
- AI generation is not enabled in this repo.

## Recommended next improvements

1. Add unit tests for `lib/generateExam` and `lib/question-validator`.
2. Extract the raw question bank into a data-only module or JSON file for easier maintenance.
3. Add a validation script to catch duplicate prompts, invalid answers, and missing explanations.
4. Remove unused dependencies or wire `Prisma` / `OpenAI` into an actual implementation.
