"use client";

import type { CSSProperties } from "react";
import { useMemo, useState } from "react";

import { AcademyResultsCard } from "@/components/results/AcademyResultsCard";
import { CategoryPerformanceCard } from "@/components/results/CategoryPerformanceCard";
import { EngagementPhasesCard } from "@/components/results/EngagementPhasesCard";
import { EngagementQuestionReview } from "@/components/results/EngagementQuestionReview";
import { QuestionReviewFilters } from "@/components/results/QuestionReviewFilters";
import { QuestionReviewList } from "@/components/results/QuestionReviewList";
import { ScoreSummaryCard } from "@/components/results/ScoreSummaryCard";
import { WeakAreasCard, type WeakArea } from "@/components/results/WeakAreasCard";
import type {
  CategoryPerformanceResult,
  QuestionReviewItem,
} from "@/components/results/types";
import { isQuestionCorrect, type SelectedAnswers } from "@/lib/answer-utils";
import { difficultyPointValue, passingPercentage } from "@/lib/exam-data";
import {
  isConcreteDifficulty,
  isConcreteQuestionType,
  type ReviewDifficultyFilter,
  type ReviewResultFilter,
  type ReviewTypeFilter,
} from "@/lib/review-filters";
import { examCategories, type ExamCategory, type ExamMode, type ExamQuestion } from "@/types/question";

const confettiPieces = Array.from({ length: 28 }, (_, index) => ({
  id: index,
  left: `${(index * 37) % 100}%`,
  delay: `${(index % 7) * 90}ms`,
  drift: `${((index % 9) - 4) * 0.85}rem`,
  hue: `${140 + ((index * 47) % 180)}`,
  size: `${6 + (index % 4) * 2}px`,
  duration: `${1850 + (index % 5) * 170}ms`,
}));

const difficultyOrder = ["easy", "medium", "hard", "expert"] as const;

type ResultsSummaryProps = {
  questions: ExamQuestion[];
  answers: SelectedAnswers;
  elapsedSeconds?: number;
  mode?: ExamMode;
  onRetake: () => void;
};

function formatElapsedTime(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function getCategoryPerformance(
  questions: ExamQuestion[],
  answers: SelectedAnswers,
): CategoryPerformanceResult[] {
  return examCategories
    .map((category) => {
      const categoryQuestions = questions.filter(
        (question) => question.category === category,
      );
      const categoryCorrect = categoryQuestions.filter((question) =>
        isQuestionCorrect(question, answers[question.id]),
      ).length;
      const categoryTotalPoints = categoryQuestions.reduce(
        (sum, question) => sum + difficultyPointValue[question.difficulty],
        0,
      );
      const categoryEarnedPoints = categoryQuestions.reduce(
        (sum, question) =>
          isQuestionCorrect(question, answers[question.id])
            ? sum + difficultyPointValue[question.difficulty]
            : sum,
        0,
      );
      const categoryPercentage =
        categoryTotalPoints === 0
          ? 0
          : Math.round((categoryEarnedPoints / categoryTotalPoints) * 100);

      return {
        category,
        correct: categoryCorrect,
        total: categoryQuestions.length,
        earnedPoints: categoryEarnedPoints,
        totalPoints: categoryTotalPoints,
        percentage: categoryPercentage,
      };
    })
    .filter((result) => result.total > 0);
}

export function ResultsSummary({
  questions,
  answers,
  elapsedSeconds,
  mode,
  onRetake,
}: ResultsSummaryProps) {
  const isEngagement = mode === "engagement";
  const isAcademy = mode === "academy";
  const [resultFilter, setResultFilter] = useState<ReviewResultFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<ExamCategory | "all">(
    "all",
  );
  const [difficultyFilter, setDifficultyFilter] =
    useState<ReviewDifficultyFilter>("all");
  const [typeFilter, setTypeFilter] = useState<ReviewTypeFilter>("all");
  const correctCount = questions.filter((question) =>
    isQuestionCorrect(question, answers[question.id]),
  ).length;
  const totalPoints = questions.reduce(
    (sum, question) => sum + difficultyPointValue[question.difficulty],
    0,
  );
  const earnedPoints = questions.reduce(
    (sum, question) =>
      isQuestionCorrect(question, answers[question.id])
        ? sum + difficultyPointValue[question.difficulty]
        : sum,
    0,
  );
  const percentage =
    totalPoints === 0 ? 0 : Math.round((earnedPoints / totalPoints) * 100);
  const passed = percentage >= passingPercentage;
  const categoryPerformance = useMemo(
    () => getCategoryPerformance(questions, answers),
    [answers, questions],
  );
  const areasToImprove = useMemo<WeakArea[]>(
    () =>
      categoryPerformance
        .map((cat) => ({
          label: cat.category,
          percentage: cat.total === 0 ? 100 : Math.round((cat.correct / cat.total) * 100),
          correct: cat.correct,
          totalQuestions: cat.total,
        }))
        .filter((cat) => cat.percentage < 70)
        .sort((a, b) => a.percentage - b.percentage),
    [categoryPerformance],
  );
  const availableCategories = categoryPerformance.map(
    (result) => result.category,
  );
  const availableDifficulties = difficultyOrder.filter((difficulty) =>
    questions.some((question) => question.difficulty === difficulty),
  );
  const availableTypes = Array.from(
    new Set(questions.map((question) => question.type)),
  ).sort((a, b) => a.localeCompare(b));
  const reviewItems = useMemo<QuestionReviewItem[]>(
    () =>
      questions
        .map((question, index) => {
          const selectedAnswers = answers[question.id];
          const isCorrect = isQuestionCorrect(question, selectedAnswers);

          return {
            question,
            selectedAnswers,
            isCorrect,
            originalIndex: index,
          };
        })
        .filter(({ question, isCorrect }) => {
          const matchesResult =
            resultFilter === "all" ||
            (resultFilter === "correct" && isCorrect) ||
            (resultFilter === "incorrect" && !isCorrect);
          const matchesCategory =
            categoryFilter === "all" || question.category === categoryFilter;
          const matchesDifficulty =
            difficultyFilter === "all" ||
            (isConcreteDifficulty(difficultyFilter) &&
              question.difficulty === difficultyFilter);
          const matchesType =
            typeFilter === "all" ||
            (isConcreteQuestionType(typeFilter) && question.type === typeFilter);

          return (
            matchesResult &&
            matchesCategory &&
            matchesDifficulty &&
            matchesType
          );
        }),
    [answers, categoryFilter, difficultyFilter, questions, resultFilter, typeFilter],
  );

  return (
    <div className="space-y-6" data-testid="results-summary">
      {passed && <CelebrationConfetti />}

      <ScoreSummaryCard
        correctCount={correctCount}
        earnedPoints={earnedPoints}
        elapsedLabel={
          elapsedSeconds !== undefined
            ? formatElapsedTime(elapsedSeconds)
            : undefined
        }
        mode={mode}
        passed={passed}
        percentage={percentage}
        totalPoints={totalPoints}
        totalQuestions={questions.length}
        onRetake={onRetake}
      />

      {isAcademy ? (
        <AcademyResultsCard questions={questions} answers={answers} />
      ) : isEngagement ? (
        <EngagementPhasesCard questions={questions} answers={answers} />
      ) : (
        <>
          <WeakAreasCard areas={areasToImprove} />
          <CategoryPerformanceCard categoryPerformance={categoryPerformance} />
        </>
      )}
      {isEngagement ? (
        <EngagementQuestionReview questions={questions} answers={answers} />
      ) : (
        <>
          <QuestionReviewFilters
            availableCategories={availableCategories}
            availableDifficulties={availableDifficulties}
            availableTypes={availableTypes}
            categoryFilter={categoryFilter}
            difficultyFilter={difficultyFilter}
            resultFilter={resultFilter}
            shownCount={reviewItems.length}
            totalCount={questions.length}
            typeFilter={typeFilter}
            onCategoryFilterChange={setCategoryFilter}
            onDifficultyFilterChange={setDifficultyFilter}
            onResultFilterChange={setResultFilter}
            onTypeFilterChange={setTypeFilter}
          />
          <QuestionReviewList reviewItems={reviewItems} />
        </>
      )}
    </div>
  );
}

function CelebrationConfetti() {
  return (
    <div className="celebration-confetti" aria-hidden="true">
      {confettiPieces.map((piece) => (
        <span
          key={piece.id}
          className="celebration-confetti-piece"
          style={
            {
              "--piece-left": piece.left,
              "--piece-delay": piece.delay,
              "--piece-drift": piece.drift,
              "--piece-hue": piece.hue,
              "--piece-size": piece.size,
              "--piece-duration": piece.duration,
            } as CSSProperties &
              Record<
                | "--piece-left"
                | "--piece-delay"
                | "--piece-drift"
                | "--piece-hue"
                | "--piece-size"
                | "--piece-duration",
                string
              >
          }
        />
      ))}
    </div>
  );
}
