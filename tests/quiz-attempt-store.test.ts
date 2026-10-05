import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

import type { ExamQuestion } from "@/types/question";

let store: typeof import("../lib/quiz-attempt-store");

function makeQuestion(
  id: number,
  category: ExamQuestion["category"],
  difficulty: ExamQuestion["difficulty"],
): ExamQuestion {
  return {
    id,
    type: "Single",
    prompt: `Question ${id}`,
    choices: ["A", "B", "C"],
    correctAnswers: ["A"],
    explanation: "Because A is correct.",
    category,
    difficulty,
  };
}

beforeAll(async () => {
  const directory = mkdtempSync(path.join(tmpdir(), "saviynt-quiz-store-"));
  process.env.QUIZ_DATABASE_PATH = path.join(directory, "test.sqlite");
  store = await import("../lib/quiz-attempt-store");
});

describe("quiz attempt store", () => {
  it("persists attempts and aggregates weak areas", () => {
    const attemptId = crypto.randomUUID();
    const questions = [
      makeQuestion(1, "Access Requests", "easy"),
      makeQuestion(2, "SoD", "hard"),
    ];

    store.createQuizAttempt({
      attemptId,
      requestedCount: questions.length,
      requestedCategories: ["Access Requests", "SoD"],
      questions,
    });

    const result = store.completeQuizAttempt(
      attemptId,
      {
        1: "A",
        2: "B",
      },
      125,
    );
    const analytics = store.getQuizAnalytics();

    expect(result?.percentage).toBe(25);
    expect(result?.durationSeconds).toBe(125);
    expect(analytics.totalAttempts).toBe(1);
    expect(analytics.totalQuestionsAnswered).toBe(2);
    expect(analytics.weakCategories[0]).toMatchObject({
      label: "SoD",
      percentage: 0,
    });
    expect(analytics.byDifficulty).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "easy", percentage: 100 }),
        expect.objectContaining({ label: "hard", percentage: 0 }),
      ]),
    );
  });

  it("scores multi-answer questions by exact selected answer set", () => {
    const attemptId = crypto.randomUUID();
    const questions: ExamQuestion[] = [
      {
        ...makeQuestion(10, "Controls", "medium"),
        type: "Multiple",
        choices: ["A", "B", "C", "D"],
        correctAnswers: ["A", "C"],
      },
    ];

    store.createQuizAttempt({
      attemptId,
      requestedCount: questions.length,
      requestedCategories: ["Controls"],
      questions,
    });

    const result = store.completeQuizAttempt(attemptId, {
      10: ["C", "A"],
    });

    expect(result?.percentage).toBe(100);
    expect(result?.gradedQuestions[0].correctAnswers).toEqual(["A", "C"]);
    expect(result?.gradedQuestions[0].correctAnswerCount).toBe(2);
  });

  it("scores engagement workflow questions by exact sequence and preserves perfect engagement scores", async () => {
    const attemptId = crypto.randomUUID();
    const questions: ExamQuestion[] = [
      {
        ...makeQuestion(20, "Lifecycle Management", "hard"),
        type: "Workflow",
        choices: ["Import", "Rules", "Provision", "Validate"],
        correctAnswers: ["Import", "Rules", "Provision", "Validate"],
        engagement: {
          id: "ENG-TEST",
          title: "Test Engagement",
          customer: {
            id: "CUST-TEST",
            name: "Test Customer",
            industry: "Testing",
            employeeCount: 100,
            authoritativeSources: ["HR"],
            applications: ["App"],
            currentProblems: [],
          },
          summary: "Test summary",
          day: {
            id: "ENG-TEST-DAY-001",
            dayNumber: 1,
            title: "Day 1",
            scenario: "Test scenario",
            learningObjectives: [],
          },
        },
      },
    ];

    store.createQuizAttempt({
      attemptId,
      mode: "engagement",
      requestedCount: questions.length,
      requestedCategories: [],
      questions,
    });

    const result = store.completeQuizAttempt(attemptId, {
      20: ["Import", "Rules", "Provision", "Validate"],
    });

    expect(result?.mode).toBe("engagement");
    expect(result?.percentage).toBe(100);
    expect(result?.gradedQuestions[0].correctAnswers).toEqual([
      "Import",
      "Rules",
      "Provision",
      "Validate",
    ]);
    expect(result?.gradedQuestions[0].correctAnswerCount).toBe(4);

    const analytics = store.getQuizAnalytics("engagement");
    expect(analytics.byEngagement).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "ENG-TEST", percentage: 100 }),
      ]),
    );

    await new Promise((resolve) => setTimeout(resolve, 5));

    const nextAttemptId = crypto.randomUUID();
    store.createQuizAttempt({
      attemptId: nextAttemptId,
      mode: "engagement",
      requestedCount: questions.length,
      requestedCategories: [],
      questions,
    });

    store.completeQuizAttempt(nextAttemptId, {
      20: ["Validate", "Provision", "Rules", "Import"],
    });

    const updatedAnalytics = store.getQuizAnalytics("engagement");
    expect(updatedAnalytics.byEngagement).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "ENG-TEST", percentage: 100 }),
      ]),
    );
  });

  it("resets score history", () => {
    const analytics = store.resetQuizAnalytics();

    expect(analytics.totalAttempts).toBe(0);
    expect(analytics.totalQuestionsAnswered).toBe(0);
    expect(analytics.recentAttempts).toEqual([]);
  });
});
