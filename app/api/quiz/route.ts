import { NextResponse } from "next/server";

import {
  engagementQuestions,
  engagementSummaries,
  playableEngagements,
} from "@/lib/engagement-data";
import { academyQuestions } from "@/lib/academy-questions";
import { examQuestions } from "@/lib/load-question";
import { getCorrectAnswers, type SubmittedAnswers } from "@/lib/answer-utils";
import { generateExam } from "@/lib/exam-generator";
import {
  completeQuizAttempt,
  createQuizAttempt,
  getQuizAnalytics,
} from "@/lib/quiz-attempt-store";
import type { Difficulty, QuestionType } from "@/types/question";

export const runtime = "nodejs";

const supportedQuestionTypes = new Set<QuestionType>([
  "Single",
  "Multiple",
  "Order",
  "Match",
  "Scenario",
  "Timeline",
  "Workflow",
  "Consultant",
]);
const supportedDifficulties = new Set<Difficulty>([
  "easy",
  "medium",
  "hard",
  "expert",
]);

function getQuestionMetadata(questions: typeof examQuestions) {
  const categoryCounts: Record<string, number> = {};
  const categoryDifficultyCounts: Record<string, Record<Difficulty, number>> =
    {};

  for (const q of questions) {
    categoryCounts[q.category] = (categoryCounts[q.category] || 0) + 1;
    categoryDifficultyCounts[q.category] ??= {
      easy: 0,
      medium: 0,
      hard: 0,
      expert: 0,
    };
    categoryDifficultyCounts[q.category][q.difficulty] += 1;
  }

  return {
    totalItems: questions.length,
    totalQuestions: questions.length,
    categoryCounts,
    categoryDifficultyCounts,
  };
}

function getEngagementMetadata() {
  return {
    totalItems: playableEngagements.length,
    totalQuestions: engagementQuestions.length,
    categoryCounts: {},
    categoryDifficultyCounts: {},
    engagements: engagementSummaries,
  };
}

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

function generateEngagementExam(
  engagementCount: number,
  requestedEngagementIds: string[],
) {
  const playableEngagementIds = new Set(
    playableEngagements.map((engagement) => engagement.id),
  );
  const selectedEngagementIds =
    requestedEngagementIds.length > 0
      ? new Set(
          requestedEngagementIds.filter((engagementId) =>
            playableEngagementIds.has(engagementId),
          ),
        )
      : new Set(
          shuffle(playableEngagements)
            .slice(0, Math.min(engagementCount, playableEngagements.length))
            .map((engagement) => engagement.id),
        );

  return engagementQuestions.filter(
    (question) =>
      question.engagement && selectedEngagementIds.has(question.engagement.id),
  );
}

export function GET(request: Request) {
  const url = new URL(request.url);
  const params = url.searchParams;

  // metadata endpoint
  if (params.get("meta") === "1" || params.get("meta") === "true") {
    const triviaMetadata = getQuestionMetadata(examQuestions);
    const engagementMetadata = getEngagementMetadata();

    return NextResponse.json({
      ...triviaMetadata,
      trivia: triviaMetadata,
      engagement: engagementMetadata,
    });
  }

  // generate an exam based on query params
  const modeParam = params.get("mode");
  const mode =
    modeParam === "engagement" || modeParam === "academy" ? modeParam : "trivia";
  const countParam = Number(params.get("count") || "0") || 70;
  const categories = params.getAll("categories");
  const requestedEngagementIds = params.getAll("engagements");
  const requestedDifficulties = params
    .getAll("difficulties")
    .filter((difficulty): difficulty is Difficulty =>
      supportedDifficulties.has(difficulty as Difficulty),
    );
  const requestedTypes = params
    .getAll("types")
    .filter((type): type is QuestionType =>
      supportedQuestionTypes.has(type as QuestionType),
    );

  const pool = examQuestions.filter((question) => {
    const categoryMatches =
      categories.length === 0 || categories.includes(question.category);
    const difficultyMatches =
      requestedDifficulties.length === 0 ||
      requestedDifficulties.includes(question.difficulty);
    const typeMatches =
      requestedTypes.length === 0 || requestedTypes.includes(question.type);

    return categoryMatches && difficultyMatches && typeMatches;
  });

  const sourceExam =
    mode === "academy"
      ? academyQuestions.filter(
          (q) => requestedEngagementIds.length === 0 || (q.academy && requestedEngagementIds.includes(q.academy.id)),
        )
      : mode === "engagement"
        ? generateEngagementExam(countParam, requestedEngagementIds)
        : generateExam(pool, countParam);

  const exam = sourceExam.map((question) => ({
    ...question,
    choices: question.choices.sort(() => Math.random() - 0.5),
  }));

  // create a persisted attempt and store answers server-side
  const sessionId = crypto.randomUUID();
  createQuizAttempt({
    attemptId: sessionId,
    mode,
    requestedCount: countParam,
    requestedCategories: categories,
    questions: exam,
  });

  // redact answers for the client
  const publicQuestions = exam.map((q) => ({
    id: q.id,
    type: q.type,
    prompt: q.prompt,
    statements: q.statements,
    choices: q.choices,
    correctAnswerCount: getCorrectAnswers(q).length,
    difficulty: q.difficulty,
    category: q.category,
    engagement: q.engagement,
    academy: q.academy,
  }));

  return NextResponse.json({ sessionId, questions: publicQuestions });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, answers, durationSeconds } = body as {
      sessionId?: string;
      answers?: SubmittedAnswers;
      durationSeconds?: number;
    };

    if (!sessionId || !answers) {
      return NextResponse.json({ error: "missing sessionId or answers" }, { status: 400 });
    }

    const result = completeQuizAttempt(sessionId, answers, durationSeconds);
    if (!result) {
      return NextResponse.json({ error: "invalid or expired sessionId" }, { status: 404 });
    }

    return NextResponse.json({
      ...result,
      analytics: getQuizAnalytics(result.mode),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }
}
