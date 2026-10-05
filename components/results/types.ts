import type { SelectedAnswers } from "@/lib/answer-utils";
import type { ExamCategory, ExamQuestion } from "@/types/question";

export type CategoryPerformanceResult = {
  category: ExamCategory;
  correct: number;
  total: number;
  earnedPoints: number;
  totalPoints: number;
  percentage: number;
};

export type QuestionReviewItem = {
  question: ExamQuestion;
  selectedAnswers: SelectedAnswers[number];
  isCorrect: boolean;
  originalIndex: number;
};
