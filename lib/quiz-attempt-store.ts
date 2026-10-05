import Database from "better-sqlite3";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";

import {
  getCorrectAnswers,
  isQuestionCorrect,
  normalizeSelectedAnswers,
  type SubmittedAnswers,
} from "./answer-utils";
import { difficultyPointValue, engagementTypePointValue, passingPercentage } from "./exam-constants";
import type {
  PerformanceBucket,
  QuizAnalytics,
} from "../types/analytics";
import type {
  Difficulty,
  ExamMode,
  ExamQuestion,
  QuestionType,
} from "../types/question";

type StoredQuestion = {
  id: number;
  type: QuestionType;
  correctAnswers: string[];
  correctAnswerCount?: number;
  explanation?: string;
  statements?: string[];
  difficulty: Difficulty;
  category: string;
  prompt: string;
  choices: string[];
};

type StoredQuestionRow = {
  question_id: number;
  question_type: QuestionType | null;
  prompt: string;
  statements_json: string | null;
  choices_json: string;
  correct_answer: string;
  correct_answers_json: string | null;
  explanation: string | null;
  category: string;
  difficulty: Difficulty;
  point_value: number;
};

type BucketRow = {
  label: string;
  total_questions: number;
  correct: number;
  earned_points: number;
  total_points: number;
};

type EngagementAttemptBucketRow = BucketRow & {
  completed_at: string;
};

type RecentAttemptRow = {
  id: string;
  completed_at: string;
  total_questions: number;
  earned_points: number;
  total_points: number;
  percentage: number;
  passed: 0 | 1;
};

type SummaryRow = {
  total_attempts: number;
  total_questions_answered: number;
  average_score: number | null;
  passed_attempts: number;
};

type AttemptModeRow = {
  mode: ExamMode | null;
};

type TableInfoRow = {
  name: string;
};

declare global {
  var quizAttemptDatabase: Database.Database | undefined;
}

const databasePath =
  process.env.QUIZ_DATABASE_PATH ??
  path.join(process.cwd(), "data", "quiz-attempts.sqlite");
const difficultyOrder: Record<Difficulty, number> = {
  easy: 0,
  medium: 1,
  hard: 2,
  expert: 3,
};
const categoryAliases: Record<string, string> = {
  Governance: "Identity Governance",
  "Technical Rules": "Rules",
  "User Update Rules": "Rules",
};

function normalizeCategory(category: string) {
  return categoryAliases[category] ?? category;
}

function getDatabase() {
  if (globalThis.quizAttemptDatabase) {
    migrate(globalThis.quizAttemptDatabase);
    return globalThis.quizAttemptDatabase;
  }

  const databaseDirectory = path.dirname(databasePath);
  if (!existsSync(databaseDirectory)) {
    mkdirSync(databaseDirectory, { recursive: true });
  }

  const db = new Database(databasePath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  migrate(db);

  globalThis.quizAttemptDatabase = db;
  return db;
}

function migrate(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS quiz_attempts (
      id TEXT PRIMARY KEY,
      started_at TEXT NOT NULL,
      completed_at TEXT,
      requested_count INTEGER NOT NULL,
      requested_categories TEXT NOT NULL,
      mode TEXT NOT NULL DEFAULT 'trivia',
      total_questions INTEGER NOT NULL DEFAULT 0,
      total_points INTEGER NOT NULL DEFAULT 0,
      earned_points INTEGER NOT NULL DEFAULT 0,
      percentage INTEGER NOT NULL DEFAULT 0,
      duration_seconds INTEGER NOT NULL DEFAULT 0,
      passed INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS quiz_attempt_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      attempt_id TEXT NOT NULL,
      question_id INTEGER NOT NULL,
      question_type TEXT NOT NULL DEFAULT 'Single',
      prompt TEXT NOT NULL,
      statements_json TEXT,
      choices_json TEXT NOT NULL,
      correct_answer TEXT NOT NULL,
      correct_answers_json TEXT,
      selected_answer TEXT,
      selected_answers_json TEXT,
      explanation TEXT,
      category TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      engagement_id TEXT,
      point_value INTEGER NOT NULL,
      correct INTEGER,
      FOREIGN KEY (attempt_id) REFERENCES quiz_attempts(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_quiz_attempt_questions_attempt_id
      ON quiz_attempt_questions(attempt_id);

    CREATE INDEX IF NOT EXISTS idx_quiz_attempt_questions_category
      ON quiz_attempt_questions(category);

    CREATE INDEX IF NOT EXISTS idx_quiz_attempt_questions_difficulty
      ON quiz_attempt_questions(difficulty);

    CREATE INDEX IF NOT EXISTS idx_quiz_attempts_completed_at
      ON quiz_attempts(completed_at);
  `);

  ensureColumn(
    db,
    "quiz_attempts",
    "mode",
    "mode TEXT NOT NULL DEFAULT 'trivia'",
  );
  ensureColumn(
    db,
    "quiz_attempts",
    "duration_seconds",
    "duration_seconds INTEGER NOT NULL DEFAULT 0",
  );
  ensureColumn(
    db,
    "quiz_attempt_questions",
    "correct_answers_json",
    "correct_answers_json TEXT",
  );
  ensureColumn(
    db,
    "quiz_attempt_questions",
    "selected_answers_json",
    "selected_answers_json TEXT",
  );
  ensureColumn(
    db,
    "quiz_attempt_questions",
    "question_type",
    "question_type TEXT NOT NULL DEFAULT 'Single'",
  );
  ensureColumn(
    db,
    "quiz_attempt_questions",
    "statements_json",
    "statements_json TEXT",
  );
  ensureColumn(
    db,
    "quiz_attempt_questions",
    "engagement_id",
    "engagement_id TEXT",
  );
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_quiz_attempt_questions_engagement_id
      ON quiz_attempt_questions(engagement_id);
  `);
}

function ensureColumn(
  db: Database.Database,
  table: "quiz_attempts" | "quiz_attempt_questions",
  column:
    | "mode"
    | "duration_seconds"
    | "correct_answers_json"
    | "selected_answers_json"
    | "question_type"
    | "statements_json"
    | "engagement_id",
  definition: string,
) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all() as TableInfoRow[];
  if (columns.some((existingColumn) => existingColumn.name === column)) {
    return;
  }

  db.exec(`ALTER TABLE ${table} ADD COLUMN ${definition}`);
}

function normalizeExamMode(mode?: string | null): ExamMode {
  if (mode === "engagement" || mode === "academy") return mode;
  return "trivia";
}

function sanitizeDurationSeconds(durationSeconds: number) {
  if (!Number.isFinite(durationSeconds)) {
    return 0;
  }

  return Math.max(0, Math.round(durationSeconds));
}

function toStoredQuestion(row: StoredQuestionRow): StoredQuestion {
  const correctAnswers = row.correct_answers_json
    ? (JSON.parse(row.correct_answers_json) as string[])
    : [row.correct_answer];

  return {
    id: row.question_id,
    type: row.question_type ?? (correctAnswers.length > 1 ? "Multiple" : "Single"),
    prompt: row.prompt,
    statements: row.statements_json
      ? (JSON.parse(row.statements_json) as string[])
      : undefined,
    choices: JSON.parse(row.choices_json) as string[],
    correctAnswers,
    correctAnswerCount: correctAnswers.length,
    explanation: row.explanation ?? undefined,
    category: normalizeCategory(row.category),
    difficulty: row.difficulty,
  };
}

function toBucket(row: BucketRow): PerformanceBucket {
  const totalPoints = row.total_points || 0;

  return {
    label: row.label,
    totalQuestions: row.total_questions,
    correct: row.correct,
    earnedPoints: row.earned_points,
    totalPoints,
    percentage: totalPoints === 0 ? 0 : Math.round((row.earned_points / totalPoints) * 100),
  };
}

export function createQuizAttempt({
  attemptId,
  mode = "trivia",
  requestedCount,
  requestedCategories,
  questions,
}: {
  attemptId: string;
  mode?: ExamMode;
  requestedCount: number;
  requestedCategories: string[];
  questions: ExamQuestion[];
}) {
  const db = getDatabase();
  const now = new Date().toISOString();
  const createAttempt = db.prepare(`
    INSERT INTO quiz_attempts (
      id,
      started_at,
      requested_count,
      requested_categories,
      mode,
      total_questions
    )
    VALUES (@id, @startedAt, @requestedCount, @requestedCategories, @mode, @totalQuestions)
  `);
  const createAttemptQuestion = db.prepare(`
    INSERT INTO quiz_attempt_questions (
      attempt_id,
      question_id,
      question_type,
      prompt,
      statements_json,
      choices_json,
      correct_answer,
      correct_answers_json,
      explanation,
      category,
      difficulty,
      engagement_id,
      point_value
    )
    VALUES (
      @attemptId,
      @questionId,
      @questionType,
      @prompt,
      @statementsJson,
      @choicesJson,
      @correctAnswer,
      @correctAnswersJson,
      @explanation,
      @category,
      @difficulty,
      @engagementId,
      @pointValue
    )
  `);
  const transaction = db.transaction(() => {
    createAttempt.run({
      id: attemptId,
      startedAt: now,
      requestedCount,
      requestedCategories: JSON.stringify(requestedCategories),
      mode,
      totalQuestions: questions.length,
    });

    for (const question of questions) {
      const correctAnswers = getCorrectAnswers(question);

      createAttemptQuestion.run({
        attemptId,
        questionId: question.id,
        questionType: question.type,
        prompt: question.prompt,
        statementsJson: question.statements
          ? JSON.stringify(question.statements)
          : null,
        choicesJson: JSON.stringify(question.choices),
        correctAnswer: correctAnswers[0],
        correctAnswersJson: JSON.stringify(correctAnswers),
        explanation: question.explanation,
        category: question.category,
        difficulty: question.difficulty,
        // engagement_id doubles as the academy pack id for mode="academy" attempts
        engagementId: question.engagement?.id ?? question.academy?.id ?? null,
        pointValue: question.engagement
          ? engagementTypePointValue[question.type]
          : difficultyPointValue[question.difficulty],
      });
    }
  });

  transaction();
}

export function getQuizAttemptQuestions(attemptId: string): StoredQuestion[] {
  const db = getDatabase();
  const rows = db
    .prepare(
      `
      SELECT
        question_id,
        question_type,
        prompt,
        statements_json,
        choices_json,
        correct_answer,
        correct_answers_json,
        explanation,
        category,
        difficulty,
        point_value
      FROM quiz_attempt_questions
      WHERE attempt_id = ?
      ORDER BY id
    `,
    )
    .all(attemptId) as StoredQuestionRow[];

  return rows.map(toStoredQuestion);
}

export function completeQuizAttempt(
  attemptId: string,
  answers: SubmittedAnswers,
  durationSeconds = 0,
) {
  const db = getDatabase();
  const selectedAnswers = normalizeSelectedAnswers(answers);
  const safeDurationSeconds = sanitizeDurationSeconds(durationSeconds);
  const attemptMode = normalizeExamMode(
    (
      db
        .prepare("SELECT mode FROM quiz_attempts WHERE id = ?")
        .get(attemptId) as AttemptModeRow | undefined
    )?.mode,
  );
  const rows = db
    .prepare(
      `
      SELECT
        question_id,
        question_type,
        prompt,
        statements_json,
        choices_json,
        correct_answer,
        correct_answers_json,
        explanation,
        category,
        difficulty,
        point_value
      FROM quiz_attempt_questions
      WHERE attempt_id = ?
      ORDER BY id
    `,
    )
    .all(attemptId) as StoredQuestionRow[];

  if (rows.length === 0) {
    return null;
  }

  let totalPoints = 0;
  let earnedPoints = 0;
  const categoryAgg: Record<
    string,
    { earned: number; total: number; correct: number; count: number }
  > = {};
  const gradedQuestions: StoredQuestion[] = [];

  const updateQuestion = db.prepare(`
    UPDATE quiz_attempt_questions
    SET selected_answer = @selectedAnswer,
      selected_answers_json = @selectedAnswersJson,
      correct = @correct
    WHERE attempt_id = @attemptId
      AND question_id = @questionId
  `);
  const updateAttempt = db.prepare(`
    UPDATE quiz_attempts
    SET completed_at = @completedAt,
      total_questions = @totalQuestions,
      total_points = @totalPoints,
      earned_points = @earnedPoints,
      percentage = @percentage,
      duration_seconds = @durationSeconds,
      passed = @passed
    WHERE id = @attemptId
  `);

  const transaction = db.transaction(() => {
    for (const row of rows) {
      const questionCorrectAnswers = row.correct_answers_json
        ? (JSON.parse(row.correct_answers_json) as string[])
        : [row.correct_answer];
      const questionSelectedAnswers = selectedAnswers[row.question_id] ?? [];
      const isCorrect = isQuestionCorrect(
        {
          type: row.question_type ?? "Single",
          correctAnswers: questionCorrectAnswers,
        },
        questionSelectedAnswers,
      );
      totalPoints += row.point_value;
      if (isCorrect) {
        earnedPoints += row.point_value;
      }

      const normalizedCategory = normalizeCategory(row.category);
      categoryAgg[normalizedCategory] = categoryAgg[normalizedCategory] || {
        earned: 0,
        total: 0,
        correct: 0,
        count: 0,
      };
      categoryAgg[normalizedCategory].total += row.point_value;
      categoryAgg[normalizedCategory].count += 1;
      if (isCorrect) {
        categoryAgg[normalizedCategory].earned += row.point_value;
        categoryAgg[normalizedCategory].correct += 1;
      }

      updateQuestion.run({
        attemptId,
        questionId: row.question_id,
        selectedAnswer: questionSelectedAnswers[0] ?? null,
        selectedAnswersJson: JSON.stringify(questionSelectedAnswers),
        correct: isCorrect ? 1 : 0,
      });

      gradedQuestions.push({
        ...toStoredQuestion(row),
      });
    }

    const percentage =
      totalPoints === 0 ? 0 : Math.round((earnedPoints / totalPoints) * 100);
    updateAttempt.run({
      attemptId,
      completedAt: new Date().toISOString(),
      totalQuestions: rows.length,
      totalPoints,
      earnedPoints,
      percentage,
      durationSeconds: safeDurationSeconds,
      passed: percentage >= passingPercentage ? 1 : 0,
    });
  });

  transaction();

  const percentage =
    totalPoints === 0 ? 0 : Math.round((earnedPoints / totalPoints) * 100);
  const categoryPerformance = Object.entries(categoryAgg).map(([category, data]) => ({
    category,
    earnedPoints: data.earned,
    totalPoints: data.total,
    correct: data.correct,
    total: data.count,
    percentage: data.total === 0 ? 0 : Math.round((data.earned / data.total) * 100),
  }));

  return {
    gradedQuestions,
    totalPoints,
    earnedPoints,
    percentage,
    durationSeconds: safeDurationSeconds,
    mode: attemptMode,
    passed: percentage >= passingPercentage,
    categoryPerformance,
  };
}

function getPerformanceBuckets(
  groupColumn: "category" | "difficulty",
  mode: ExamMode,
) {
  const db = getDatabase();
  const rows = db
    .prepare(
      `
      SELECT
        q.${groupColumn} AS label,
        COUNT(*) AS total_questions,
        SUM(CASE WHEN q.correct = 1 THEN 1 ELSE 0 END) AS correct,
        SUM(CASE WHEN q.correct = 1 THEN q.point_value ELSE 0 END) AS earned_points,
        SUM(q.point_value) AS total_points
      FROM quiz_attempt_questions q
      INNER JOIN quiz_attempts a ON a.id = q.attempt_id
      WHERE a.completed_at IS NOT NULL
        AND a.mode = @mode
      GROUP BY q.${groupColumn}
      ORDER BY total_questions DESC, label ASC
    `,
    )
    .all({ mode }) as BucketRow[];

  if (groupColumn === "difficulty") {
    return rows.map(toBucket);
  }

  const mergedRows = new Map<string, BucketRow>();
  for (const row of rows) {
    const label = normalizeCategory(row.label);
    const current = mergedRows.get(label);

    if (!current) {
      mergedRows.set(label, { ...row, label });
      continue;
    }

    current.total_questions += row.total_questions;
    current.correct += row.correct;
    current.earned_points += row.earned_points;
    current.total_points += row.total_points;
  }

  return [...mergedRows.values()]
    .sort(
      (a, b) =>
        b.total_questions - a.total_questions || a.label.localeCompare(b.label),
    )
    .map(toBucket);
}

function getEngagementPerformanceBuckets(mode: ExamMode, bestThreshold = 100) {
  const db = getDatabase();
  const rows = db
    .prepare(
      `
      SELECT
        q.engagement_id AS label,
        a.completed_at,
        COUNT(*) AS total_questions,
        SUM(CASE WHEN q.correct = 1 THEN 1 ELSE 0 END) AS correct,
        SUM(CASE WHEN q.correct = 1 THEN q.point_value ELSE 0 END) AS earned_points,
        SUM(q.point_value) AS total_points
      FROM quiz_attempt_questions q
      INNER JOIN quiz_attempts a ON a.id = q.attempt_id
      WHERE a.completed_at IS NOT NULL
        AND a.mode = @mode
        AND q.engagement_id IS NOT NULL
      GROUP BY q.engagement_id, a.id, a.completed_at
      ORDER BY a.completed_at DESC
    `,
    )
    .all({ mode }) as EngagementAttemptBucketRow[];

  const latestByEngagement = new Map<string, EngagementAttemptBucketRow>();
  const getRowPercentage = (row: EngagementAttemptBucketRow) =>
    row.total_points === 0
      ? 0
      : Math.round((row.earned_points / row.total_points) * 100);

  for (const row of rows) {
    const current = latestByEngagement.get(row.label);

    if (!current) {
      latestByEngagement.set(row.label, row);
      continue;
    }

    if (getRowPercentage(current) < bestThreshold && getRowPercentage(row) >= bestThreshold) {
      latestByEngagement.set(row.label, row);
    }
  }

  return [...latestByEngagement.values()]
    .sort((a, b) => a.label.localeCompare(b.label))
    .map(toBucket);
}

export function getQuizAnalytics(mode: ExamMode = "trivia"): QuizAnalytics {
  const db = getDatabase();
  const normalizedMode = normalizeExamMode(mode);
  const summary = db
    .prepare(
      `
      SELECT
        COUNT(*) AS total_attempts,
        COALESCE(SUM(total_questions), 0) AS total_questions_answered,
        AVG(percentage) AS average_score,
        SUM(CASE WHEN passed = 1 THEN 1 ELSE 0 END) AS passed_attempts
      FROM quiz_attempts
      WHERE completed_at IS NOT NULL
        AND mode = @mode
    `,
    )
    .get({ mode: normalizedMode }) as SummaryRow;
  const recentAttempts = db
    .prepare(
      `
      SELECT
        id,
        completed_at,
        total_questions,
        earned_points,
        total_points,
        percentage,
        passed
      FROM quiz_attempts
      WHERE completed_at IS NOT NULL
        AND mode = @mode
      ORDER BY completed_at DESC
      LIMIT 8
    `,
    )
    .all({ mode: normalizedMode }) as RecentAttemptRow[];
  const byCategory = getPerformanceBuckets("category", normalizedMode);
  const byDifficulty = getPerformanceBuckets("difficulty", normalizedMode).sort(
    (a, b) =>
      difficultyOrder[a.label as Difficulty] -
      difficultyOrder[b.label as Difficulty],
  );
  const byEngagement =
    normalizedMode === "engagement"
      ? getEngagementPerformanceBuckets(normalizedMode)
      : normalizedMode === "academy"
        ? getEngagementPerformanceBuckets(normalizedMode, passingPercentage)
        : [];
  const totalAttempts = summary.total_attempts || 0;

  return {
    totalAttempts,
    totalQuestionsAnswered: summary.total_questions_answered || 0,
    averageScore: Math.round(summary.average_score ?? 0),
    passRate:
      totalAttempts === 0
        ? 0
        : Math.round(((summary.passed_attempts || 0) / totalAttempts) * 100),
    recentAttempts: recentAttempts.map((attempt) => ({
      id: attempt.id,
      completedAt: attempt.completed_at,
      totalQuestions: attempt.total_questions,
      earnedPoints: attempt.earned_points,
      totalPoints: attempt.total_points,
      percentage: attempt.percentage,
      passed: attempt.passed === 1,
    })),
    byCategory,
    byDifficulty,
    byEngagement,
    weakCategories: [...byCategory]
      .filter((bucket) => bucket.totalQuestions > 0)
      .sort((a, b) => a.percentage - b.percentage || b.totalQuestions - a.totalQuestions),
    weakDifficulties: [...byDifficulty]
      .filter((bucket) => bucket.totalQuestions > 0)
      .sort((a, b) => a.percentage - b.percentage || b.totalQuestions - a.totalQuestions)
      .slice(0, 3),
  };
}

export function resetQuizAnalytics(mode?: ExamMode) {
  const db = getDatabase();
  if (mode) {
    db.prepare("DELETE FROM quiz_attempts WHERE mode = ?").run(
      normalizeExamMode(mode),
    );

    return getQuizAnalytics(mode);
  }

  db.prepare("DELETE FROM quiz_attempts").run();

  return getQuizAnalytics("trivia");
}
