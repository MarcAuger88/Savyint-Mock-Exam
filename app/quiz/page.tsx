import { QuizClient } from "@/components/QuizClient";
import type { Difficulty, ExamMode, QuestionType } from "@/types/question";

type QuizPageProps = {
  searchParams?: Promise<{
    categories?: string | string[];
    count?: string | string[];
    difficulties?: string | string[];
    engagements?: string | string[];
    fresh?: string | string[];
    mode?: string | string[];
    types?: string | string[];
  }>;
};

const defaultQuestionCount = 25;
const minQuestionCount = 10;

function parseQuestionCount(count: string | string[] | undefined, mode: ExamMode) {
  const countValue = Array.isArray(count) ? count[0] : count;
  const parsedCount = Number(countValue);
  const minimumCount = mode === "trivia" ? minQuestionCount : 1;

  if (!Number.isFinite(parsedCount)) {
    return defaultQuestionCount;
  }

  return Math.max(minimumCount, Math.floor(parsedCount));
}

function parseFreshStart(fresh?: string | string[]) {
  const freshValue = Array.isArray(fresh) ? fresh[0] : fresh;

  return freshValue === "1" || freshValue === "true";
}

function parseExamMode(mode?: string | string[]): ExamMode {
  const modeValue = Array.isArray(mode) ? mode[0] : mode;

  if (modeValue === "engagement" || modeValue === "academy") return modeValue;
  return "trivia";
}

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

function parseQuestionTypes(types?: string | string[]) {
  const typeValues = Array.isArray(types) ? types : types ? [types] : [];

  return typeValues.filter((type): type is QuestionType =>
    supportedQuestionTypes.has(type as QuestionType),
  );
}

function parseDifficulties(difficulties?: string | string[]) {
  const difficultyValues = Array.isArray(difficulties)
    ? difficulties
    : difficulties
      ? [difficulties]
      : [];

  return difficultyValues.filter((difficulty): difficulty is Difficulty =>
    supportedDifficulties.has(difficulty as Difficulty),
  );
}

export default async function QuizPage({ searchParams }: QuizPageProps) {
  const params = await searchParams;
  const categories = params?.categories;
  const requestedCategories = Array.isArray(categories)
    ? categories
    : categories
      ? [categories]
      : [];
  const freshStart = parseFreshStart(params?.fresh);
  const mode = parseExamMode(params?.mode);
  const questionCount = parseQuestionCount(params?.count, mode);
  const requestedTypes = parseQuestionTypes(params?.types);
  const requestedDifficulties = parseDifficulties(params?.difficulties);
  const requestedEngagementIds = Array.isArray(params?.engagements)
    ? params.engagements
    : params?.engagements
      ? [params.engagements]
      : [];

  return (
    <QuizClient
      key={`${mode}-${requestedCategories.join("|") || "all-categories"}-${requestedDifficulties.join("|") || "all-difficulties"}-${requestedTypes.join("|") || "all-types"}-${requestedEngagementIds.join("|") || "all-engagements"}-${questionCount}-${freshStart ? "fresh" : "resume"}`}
      mode={mode}
      questionCount={questionCount}
      freshStart={freshStart}
      requestedCategories={requestedCategories}
      requestedDifficulties={requestedDifficulties}
      requestedEngagementIds={requestedEngagementIds}
      requestedTypes={requestedTypes}
    />
  );
}
