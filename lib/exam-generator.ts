import type { Difficulty, ExamQuestion, QuestionType } from "@/types/question";

const targetDifficultyRatio: Record<Difficulty, number> = {
  easy: 0.25,
  medium: 0.5,
  hard: 0.25,
  expert: 0,
};

const difficultyFillOrder: Difficulty[] = ["medium", "easy", "hard"];
const questionTypeByLowercase: Record<string, QuestionType> = {
  single: "Single",
  multiple: "Multiple",
  order: "Order",
  match: "Match",
  scenario: "Scenario",
  timeline: "Timeline",
  workflow: "Workflow",
  consultant: "Consultant",
};
const difficultyAliases: Record<string, string> = {
  foundation: "easy",
  beginner: "easy",
  intermediate: "medium",
  advanced: "hard",
};

const categoryAliases: Record<string, ExamQuestion["category"]> = {
  Governance: "Identity Governance",
  "Technical Rules": "Rules",
  "User Update Rules": "Rules",
  "Role Management": "Roles",
  "Dynamic Roles": "Roles",
  "Identity Lifecycle": "Lifecycle Management",
  "Account Correlation": "Correlation",
  "Job Control": "Jobs",
};

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

function getTargetDifficultyCounts(size: number): Record<Difficulty, number> {
  const targets = difficultyFillOrder.map((difficulty) => {
    const exactCount = size * targetDifficultyRatio[difficulty];

    return {
      difficulty,
      count: Math.floor(exactCount),
      remainder: exactCount % 1,
    };
  });
  let assignedCount = targets.reduce((sum, target) => sum + target.count, 0);

  for (const target of [...targets].sort((a, b) => b.remainder - a.remainder)) {
    if (assignedCount >= size) {
      break;
    }

    target.count += 1;
    assignedCount += 1;
  }

  return targets.reduce(
    (counts, target) => ({
      ...counts,
      [target.difficulty]: target.count,
    }),
    { easy: 0, medium: 0, hard: 0, expert: 0 } as Record<Difficulty, number>,
  );
}

type MatchItem = { id: string; text: string };
type MatchPair = { leftId: string; rightId: string };

type PackQuestion = Record<string, unknown> & { type?: string };
type QuestionBankItem = Partial<Omit<ExamQuestion, "id" | "type">> & {
  type?: string;
  items?: string[];
  steps?: string[];
  correctOrder?: string[];
  correctAnswer?: string[] | Record<string, string>;
  leftItems?: MatchItem[];
  rightItems?: MatchItem[];
  correctMatches?: MatchPair[];
  questions?: PackQuestion[];
};

function flattenBankItems(items: QuestionBankItem[]): QuestionBankItem[] {
  const flat: QuestionBankItem[] = [];
  for (const item of items) {
    if (item.questions && !item.type) {
      flat.push(...(item.questions as QuestionBankItem[]));
    } else {
      flat.push(item);
    }
  }
  return flat;
}

function normalizeCorrectAnswer(
  item: QuestionBankItem,
): { correctAnswers: string[]; statements?: string[]; choices?: string[] } {
  const raw = item.correctAnswer;

  // Object-style match: { leftText: rightText, ... }
  if (raw && !Array.isArray(raw) && typeof raw === "object") {
    const entries = Object.entries(raw);
    return {
      statements: entries.map(([k]) => k),
      choices: entries.map(([, v]) => v),
      correctAnswers: entries.map(([, v]) => v),
    };
  }

  // Array-style (ordered answers or multiple correct)
  if (Array.isArray(raw)) {
    return { correctAnswers: raw as string[] };
  }

  return { correctAnswers: item.correctAnswers ?? item.correctOrder ?? [] };
}

export function generateQuestionBank(items: QuestionBankItem[]): ExamQuestion[] {
  const questions = flattenBankItems(items);
  return questions.filter((q) => q.type).map((question, index) => {
    const type = questionTypeByLowercase[question.type!.toLowerCase()] ?? "Single";

    let choices = question.choices ?? question.items ?? question.steps ?? [];
    let statements = question.statements;
    const normalized = normalizeCorrectAnswer(question);
    let correctAnswers = normalized.correctAnswers;
    if (normalized.statements) statements = normalized.statements;
    if (normalized.choices) choices = normalized.choices;

    if (question.leftItems && question.rightItems && question.correctMatches) {
      const rightById = new Map(question.rightItems.map((r) => [r.id, r.text]));
      const matchByLeftId = new Map(question.correctMatches.map((m) => [m.leftId, m.rightId]));
      statements = question.leftItems.map((l) => l.text);
      choices = question.rightItems.map((r) => r.text);
      correctAnswers = question.leftItems.map((l) => rightById.get(matchByLeftId.get(l.id) ?? "") ?? "");
    }
    const category =
      categoryAliases[question.category ?? ""] ??
      (question.category as ExamQuestion["category"]);

    return {
      ...question,
      id: index + 1,
      type,
      choices,
      statements,
      correctAnswers,
      explanation: question.explanation ?? "",
      category,
      difficulty: (difficultyAliases[question.difficulty?.toLowerCase() ?? ""] ?? question.difficulty?.toLowerCase() ?? "medium") as ExamQuestion["difficulty"],
      prompt: question.prompt ?? "",
    };
  });
}

export function generateExam(
  questions: ExamQuestion[],
  size = 70,
): ExamQuestion[] {
  const examSize = Math.min(size, questions.length);
  const targetCounts = getTargetDifficultyCounts(examSize);
  const selectedQuestions: ExamQuestion[] = [];
  const selectedIds = new Set<number>();

  for (const difficulty of difficultyFillOrder) {
    const questionsForDifficulty = shuffle(
      questions.filter((question) => question.difficulty === difficulty),
    );
    const targetCount = targetCounts[difficulty];

    for (const question of questionsForDifficulty.slice(0, targetCount)) {
      selectedQuestions.push(question);
      selectedIds.add(question.id);
    }
  }

  if (selectedQuestions.length < examSize) {
    const remainingQuestions = shuffle(
      questions.filter((question) => !selectedIds.has(question.id)),
    );
    selectedQuestions.push(
      ...remainingQuestions.slice(0, examSize - selectedQuestions.length),
    );
  }

  return shuffle(selectedQuestions);
}
