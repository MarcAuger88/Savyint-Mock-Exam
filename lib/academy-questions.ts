import { academyPacks } from "@/lib/academy-data";
import type { AcademyContext, Difficulty, ExamQuestion, QuestionType } from "@/types/question";

const academyQuestionIdOffset = 3_000_000;

const questionTypeByLowercase: Record<string, QuestionType> = {
  single: "Single",
  multiple: "Multiple",
  order: "Order",
  ordering: "Order",
  match: "Match",
  scenario: "Scenario",
  timeline: "Timeline",
  workflow: "Workflow",
  consultant: "Consultant",
};

const difficultyAliases: Record<string, Difficulty> = {
  foundation: "easy",
  beginner: "easy",
  intermediate: "medium",
  advanced: "hard",
  capstone: "expert",
};

function toText(item: unknown): string {
  if (typeof item === "string") return item;
  if (item && typeof item === "object" && "text" in item)
    return String((item as { text: unknown }).text ?? "");
  return "";
}

function normalizeType(type: string): QuestionType {
  return questionTypeByLowercase[type.toLowerCase()] ?? "Single";
}

function normalizeDifficulty(value: string): Difficulty {
  const lower = value.toLowerCase();
  return (difficultyAliases[lower] ?? lower) as Difficulty;
}

export const academyQuestions: ExamQuestion[] = academyPacks.flatMap(
  (pack, packIndex) => {
    const context: AcademyContext = {
      id: pack.id,
      title: pack.title,
      category: pack.category,
    };

    return (pack.questions ?? []).map((q, questionIndex) => {
      const raw = q as Record<string, unknown>;
      const type = normalizeType((raw.type as string | undefined) ?? "single");
      const prompt =
        (raw.prompt as string | undefined) ??
        (raw.question as string | undefined) ??
        "";
      const difficulty = normalizeDifficulty(
        (raw.difficulty as string | undefined) ?? pack.difficulty,
      );
      const explanation = (raw.explanation as string | undefined) ?? "";
      const category = pack.category as ExamQuestion["category"];
      const baseId = academyQuestionIdOffset + packIndex * 1000 + questionIndex + 1;

      // ── Match: object correctAnswer + leftItems/rightItems ──────────────
      const rawCorrectAnswer = raw.correctAnswer;
      if (
        type === "Match" &&
        rawCorrectAnswer &&
        !Array.isArray(rawCorrectAnswer) &&
        typeof rawCorrectAnswer === "object"
      ) {
        const mapping = rawCorrectAnswer as Record<string, string>;
        const statements = Object.keys(mapping);
        const correctAnswers = Object.values(mapping);
        // Use the explicit rightItems pool if present, otherwise derive from values
        const rawRight = raw.rightItems as unknown[] | undefined;
        const choices = rawRight && rawRight.length > 0
          ? rawRight.map(toText).filter(Boolean)
          : [...new Set(correctAnswers)];
        return {
          id: baseId,
          type,
          prompt,
          statements,
          choices,
          correctAnswers,
          correctAnswerCount: correctAnswers.length,
          explanation,
          category,
          difficulty,
          academy: context,
        };
      }

      // ── Match: leftItems/rightItems arrays (no object correctAnswer) ────
      const leftItems = raw.leftItems as unknown[] | undefined;
      const rightItems = raw.rightItems as unknown[] | undefined;
      if (type === "Match" && leftItems && rightItems) {
        const statements = leftItems.map(toText);
        const choices = rightItems.map(toText);
        const correctAnswers =
          Array.isArray(rawCorrectAnswer)
            ? (rawCorrectAnswer as string[])
            : statements.map((_, i) => choices[i] ?? "");
        return {
          id: baseId,
          type,
          prompt,
          statements,
          choices,
          correctAnswers,
          correctAnswerCount: correctAnswers.length,
          explanation,
          category,
          difficulty,
          academy: context,
        };
      }

      // ── All other types ─────────────────────────────────────────────────
      const choices: string[] =
        (raw.choices as string[] | undefined) ??
        (raw.elements as string[] | undefined) ??
        (raw.items as string[] | undefined) ??
        (raw.steps as string[] | undefined) ??
        [];

      let correctAnswers: string[] = [];
      if (Array.isArray(rawCorrectAnswer)) {
        correctAnswers = rawCorrectAnswer as string[];
      } else if (typeof rawCorrectAnswer === "string") {
        correctAnswers = [rawCorrectAnswer];
      } else {
        correctAnswers =
          (raw.correctAnswers as string[] | undefined) ??
          (raw.correctOrder as string[] | undefined) ??
          [];
      }

      return {
        id: baseId,
        type,
        prompt,
        choices,
        correctAnswers,
        correctAnswerCount: correctAnswers.length,
        explanation,
        category,
        difficulty,
        academy: context,
      };
    });
  },
);
