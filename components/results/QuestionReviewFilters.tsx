import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  isReviewDifficultyFilter,
  isReviewResultFilter,
  isReviewTypeFilter,
  type ReviewDifficultyFilter,
  type ReviewResultFilter,
  type ReviewTypeFilter,
} from "@/lib/review-filters";
import type { Difficulty, ExamCategory, QuestionType } from "@/types/question";

type QuestionReviewFiltersProps = {
  availableCategories: ExamCategory[];
  availableDifficulties: Difficulty[];
  availableTypes: QuestionType[];
  categoryFilter: ExamCategory | "all";
  difficultyFilter: ReviewDifficultyFilter;
  resultFilter: ReviewResultFilter;
  shownCount: number;
  totalCount: number;
  typeFilter: ReviewTypeFilter;
  onCategoryFilterChange: (value: ExamCategory | "all") => void;
  onDifficultyFilterChange: (value: ReviewDifficultyFilter) => void;
  onResultFilterChange: (value: ReviewResultFilter) => void;
  onTypeFilterChange: (value: ReviewTypeFilter) => void;
};

export function QuestionReviewFilters({
  availableCategories,
  availableDifficulties,
  availableTypes,
  categoryFilter,
  difficultyFilter,
  resultFilter,
  shownCount,
  totalCount,
  typeFilter,
  onCategoryFilterChange,
  onDifficultyFilterChange,
  onResultFilterChange,
  onTypeFilterChange,
}: QuestionReviewFiltersProps) {
  return (
    <Card className="border border-white/10 bg-neutral-900/80 text-neutral-50 ring-0">
      <CardHeader className="px-6 py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <CardTitle className="text-lg text-white">
              Question Review
            </CardTitle>
            <p className="mt-2 text-sm text-neutral-400">
              Showing {shownCount} of {totalCount} questions
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <label className="grid gap-1 text-xs text-neutral-500">
              Result
              <select
                value={resultFilter}
                onChange={(event) => {
                  const value = event.currentTarget.value;
                  if (isReviewResultFilter(value)) {
                    onResultFilterChange(value);
                  }
                }}
                className="h-9 rounded-md border border-white/10 bg-neutral-950 px-2 text-sm text-neutral-100 outline-none focus:border-blue-500/50"
              >
                <option value="all">All</option>
                <option value="incorrect">Incorrect</option>
                <option value="correct">Correct</option>
              </select>
            </label>
            <label className="grid gap-1 text-xs text-neutral-500">
              Category
              <select
                value={categoryFilter}
                onChange={(event) =>
                  onCategoryFilterChange(
                    event.currentTarget.value as ExamCategory | "all",
                  )
                }
                className="h-9 rounded-md border border-white/10 bg-neutral-950 px-2 text-sm text-neutral-100 outline-none focus:border-blue-500/50"
              >
                <option value="all">All</option>
                {availableCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-xs text-neutral-500">
              Difficulty
              <select
                value={difficultyFilter}
                onChange={(event) => {
                  const value = event.currentTarget.value;
                  if (isReviewDifficultyFilter(value)) {
                    onDifficultyFilterChange(value);
                  }
                }}
                className="h-9 rounded-md border border-white/10 bg-neutral-950 px-2 text-sm text-neutral-100 outline-none focus:border-blue-500/50"
              >
                <option value="all">All</option>
                {availableDifficulties.map((difficulty) => (
                  <option key={difficulty} value={difficulty}>
                    {capitalizeLabel(difficulty)}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-xs text-neutral-500">
              Type
              <select
                value={typeFilter}
                onChange={(event) => {
                  const value = event.currentTarget.value;
                  if (isReviewTypeFilter(value)) {
                    onTypeFilterChange(value);
                  }
                }}
                className="h-9 rounded-md border border-white/10 bg-neutral-950 px-2 text-sm text-neutral-100 outline-none focus:border-blue-500/50"
              >
                <option value="all">All</option>
                {availableTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}

function capitalizeLabel(label: string) {
  return label.charAt(0).toUpperCase() + label.slice(1);
}
