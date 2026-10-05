import type { Difficulty, ExamQuestion, QuestionType } from "@/types/question";

export type ValidationIssue = {
  index: number;
  severity: "error" | "warning";
  message: string;
};

const TARGET_DIFFICULTY_RATIO: Record<Difficulty, number> = {
  easy: 0.3,
  medium: 0.5,
  hard: 0.2,
  expert: 0,
};
const QUESTION_TYPES: QuestionType[] = [
  "Single",
  "Multiple",
  "Order",
  "Match",
  "Scenario",
  "Timeline",
  "Workflow",
  "Consultant",
];
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
const sequenceQuestionTypes = new Set<QuestionType>([
  "Order",
  "Timeline",
  "Workflow",
]);

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function validateQuestions(questions: ExamQuestion[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const seenPrompts = new Map<string, number>();

  questions.forEach((q, index) => {
    const questionType = questionTypeByLowercase[String(q.type).toLowerCase()];
    const legacyQuestion = q as ExamQuestion & {
      items?: string[];
      steps?: string[];
      correctOrder?: string[];
    };
    const choices = Array.isArray(q.choices)
      ? q.choices
      : Array.isArray(legacyQuestion.items)
        ? legacyQuestion.items
        : Array.isArray(legacyQuestion.steps)
          ? legacyQuestion.steps
          : [];
    const correctAnswers = Array.isArray(q.correctAnswers)
      ? q.correctAnswers
      : Array.isArray(legacyQuestion.correctOrder)
        ? legacyQuestion.correctOrder
        : [];

    if ("correctAnswer" in q) {
      issues.push({
        index,
        severity: "error",
        message: "Use correctAnswers instead of correctAnswer.",
      });
    }

    if (!q.prompt?.trim()) {
      issues.push({ index, severity: "error", message: "Missing prompt." });
    }

    if (!questionType || !QUESTION_TYPES.includes(questionType)) {
      issues.push({
        index,
        severity: "error",
        message: "Invalid question type.",
      });
    }

    const normalizedPrompt = normalize(q.prompt);
    if (seenPrompts.has(normalizedPrompt)) {
      issues.push({
        index,
        severity: "error",
        message: `Duplicate prompt. First seen at index ${seenPrompts.get(
          normalizedPrompt,
        )}.`,
      });
    } else {
      seenPrompts.set(normalizedPrompt, index);
    }

    const maxChoices = questionType === "Single" ? 4 : 8;

    if (choices.length < 2 || choices.length > maxChoices) {
      issues.push({
        index,
        severity: "error",
        message: `Question must have between 2 and ${maxChoices} choices.`,
      });
    } else {
      const normalizedChoices = choices.map(normalize);
      const uniqueChoices = new Set(normalizedChoices);

      if (uniqueChoices.size !== choices.length) {
        issues.push({
          index,
          severity: "error",
          message: "Choices must be unique.",
        });
      }

      if (correctAnswers.length === 0) {
        issues.push({
          index,
          severity: "error",
          message: "Question must include at least one correctAnswers value.",
        });
      }

      for (const answer of correctAnswers) {
        if (!choices.includes(answer)) {
          issues.push({
            index,
            severity: "error",
            message: "Each correct answer must exactly match one of the choices.",
          });
        }
      }

      if (new Set(correctAnswers).size !== correctAnswers.length) {
        issues.push({
          index,
          severity: "error",
          message: "correctAnswers must be unique.",
        });
      }

      if (questionType === "Single" && correctAnswers.length !== 1) {
        issues.push({
          index,
          severity: "error",
          message: "Single questions must include exactly one correct answer.",
        });
      }

      if (sequenceQuestionTypes.has(questionType)) {
        const choicesSet = new Set(choices);
        if (
          correctAnswers.length !== choices.length ||
          !correctAnswers.every((answer) => choicesSet.has(answer))
        ) {
          issues.push({
            index,
            severity: "error",
            message: `${questionType} questions must include every choice in correctAnswers in the correct sequence.`,
          });
        }
      }

      if (questionType === "Match") {
        if (!Array.isArray(q.statements) || q.statements.length < 2) {
          issues.push({
            index,
            severity: "error",
            message: "Match questions must include at least two statements.",
          });
        } else if (q.statements.length !== correctAnswers.length) {
          issues.push({
            index,
            severity: "error",
            message: "Match questions must have one correct answer per statement.",
          });
        }
      }

      if (
        questionType === "Scenario" &&
        (!Array.isArray(q.statements) || q.statements.length < 2)
      ) {
        issues.push({
          index,
          severity: "error",
          message: "Scenario questions must include at least two statements.",
        });
      }
    }

    if (!q.explanation?.trim()) {
      issues.push({
        index,
        severity: "warning",
        message: "Missing explanation.",
      });
    }

    if (!q.category?.trim()) {
      issues.push({
        index,
        severity: "warning",
        message: "Missing category.",
      });
    }

    if (!["easy", "medium", "hard", "expert"].includes(q.difficulty)) {
      issues.push({
        index,
        severity: "error",
        message: "Invalid difficulty.",
      });
    }
  });

  return issues;
}

function getDifficultyDistribution(questions: ExamQuestion[]) {
  const counts: Record<Difficulty, number> = {
    easy: 0,
    medium: 0,
    hard: 0,
    expert: 0,
  };

  for (const q of questions) {
    if (q.difficulty in counts) {
      counts[q.difficulty]++;
    }
  }

  return Object.fromEntries(
    Object.entries(counts).map(([difficulty, count]) => [
      difficulty,
      {
        count,
        percentage: Number(((count / questions.length) * 100).toFixed(1)),
        target: TARGET_DIFFICULTY_RATIO[difficulty as Difficulty] * 100,
      },
    ]),
  );
}

function getCategoryDistribution(questions: ExamQuestion[]) {
  return questions.reduce<Record<string, number>>((acc, q) => {
    const category = q.category || "unknown";
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});
}

export function analyzeQuestionBank(questions: ExamQuestion[]) {
  const issues = validateQuestions(questions);

  return {
    totalQuestions: questions.length,
    errorCount: issues.filter((i) => i.severity === "error").length,
    warningCount: issues.filter((i) => i.severity === "warning").length,
    difficultyDistribution: getDifficultyDistribution(questions),
    categoryDistribution: getCategoryDistribution(questions),
    issues,
  };
}
