import type { Difficulty, QuestionType } from "@/types/question";

export const reviewResultFilters = ["all", "incorrect", "correct"] as const;
export type ReviewResultFilter = (typeof reviewResultFilters)[number];

export const reviewDifficultyFilters = [
  "all",
  "easy",
  "medium",
  "hard",
  "expert",
] as const;
export type ReviewDifficultyFilter = (typeof reviewDifficultyFilters)[number];

export const reviewTypeFilters = [
  "all",
  "Single",
  "Multiple",
  "Order",
  "Match",
  "Scenario",
  "Timeline",
  "Workflow",
  "Consultant",
] as const;
export type ReviewTypeFilter = (typeof reviewTypeFilters)[number];

export function isReviewResultFilter(value: string): value is ReviewResultFilter {
  return reviewResultFilters.includes(value as ReviewResultFilter);
}

export function isReviewDifficultyFilter(
  value: string,
): value is ReviewDifficultyFilter {
  return reviewDifficultyFilters.includes(value as ReviewDifficultyFilter);
}

export function isReviewTypeFilter(value: string): value is ReviewTypeFilter {
  return reviewTypeFilters.includes(value as ReviewTypeFilter);
}

export function isConcreteDifficulty(
  value: ReviewDifficultyFilter,
): value is Difficulty {
  return value !== "all";
}

export function isConcreteQuestionType(
  value: ReviewTypeFilter,
): value is QuestionType {
  return value !== "all";
}
