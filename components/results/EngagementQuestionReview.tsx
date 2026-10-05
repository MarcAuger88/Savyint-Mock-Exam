"use client";

import { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatAnswerList,
  getCorrectAnswers,
  isQuestionCorrect,
  type SelectedAnswers,
} from "@/lib/answer-utils";
import type { ExamQuestion } from "@/types/question";

type ResultFilter = "all" | "correct" | "incorrect";

type DayGroup = {
  dayId: string;
  dayNumber: number;
  title: string;
  questions: Array<{ question: ExamQuestion; indexInDay: number }>;
};

type EngagementQuestionReviewProps = {
  questions: ExamQuestion[];
  answers: SelectedAnswers;
};

function getScoreBadgeClass(correct: number, total: number) {
  const pct = total === 0 ? 0 : Math.round((correct / total) * 100);
  if (pct >= 80) return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  if (pct >= 60) return "border-amber-400/30 bg-amber-400/10 text-amber-200";
  return "border-red-500/30 bg-red-500/10 text-red-300";
}

export function EngagementQuestionReview({
  questions,
  answers,
}: EngagementQuestionReviewProps) {
  const [resultFilter, setResultFilter] = useState<ResultFilter>("all");

  const dayGroups: DayGroup[] = [];
  const dayMap = new Map<string, DayGroup>();

  for (const question of questions) {
    if (!question.engagement) continue;
    const { day } = question.engagement;
    if (!dayMap.has(day.id)) {
      const group: DayGroup = {
        dayId: day.id,
        dayNumber: day.dayNumber,
        title: day.title,
        questions: [],
      };
      dayMap.set(day.id, group);
      dayGroups.push(group);
    }
    const group = dayMap.get(day.id)!;
    group.questions.push({ question, indexInDay: group.questions.length });
  }

  dayGroups.sort((a, b) => a.dayNumber - b.dayNumber);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-white">Question Review</h2>
        <div className="flex gap-1 rounded-lg border border-white/10 bg-neutral-900/50 p-1">
          {(["all", "incorrect", "correct"] as ResultFilter[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setResultFilter(f)}
              className={`rounded-md px-3 py-1 text-sm font-medium transition ${
                resultFilter === f
                  ? "bg-blue-500/15 text-blue-100 border border-blue-500/50"
                  : "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-100"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {dayGroups.map((group) => {
        const filtered = group.questions.filter(({ question }) => {
          const correct = isQuestionCorrect(question, answers[question.id]);
          if (resultFilter === "correct") return correct;
          if (resultFilter === "incorrect") return !correct;
          return true;
        });

        if (filtered.length === 0) return null;

        const correctInDay = group.questions.filter(({ question }) =>
          isQuestionCorrect(question, answers[question.id]),
        ).length;

        return (
          <div key={group.dayId} className="space-y-3">
            <div className="flex items-center gap-3 border-b border-white/10 pb-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Day {group.dayNumber}
                </p>
                <p className="mt-0.5 text-base font-semibold text-blue-300">
                  {group.title}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full border px-2.5 py-0.5 text-sm font-medium ${getScoreBadgeClass(
                  correctInDay,
                  group.questions.length,
                )}`}
              >
                {correctInDay}/{group.questions.length} correct
              </span>
            </div>

            {filtered.map(({ question, indexInDay }) => {
              const isCorrect = isQuestionCorrect(question, answers[question.id]);
              const correctAnswers = getCorrectAnswers(question);
              const selectedAnswers = answers[question.id];

              return (
                <Card
                  key={question.id}
                  className="border border-white/10 bg-neutral-900/80 text-neutral-50 ring-0"
                >
                  <CardHeader className="px-5 pt-5">
                    <div className="flex items-start gap-3">
                      {isCorrect ? (
                        <CheckCircle2
                          className="mt-1 size-5 shrink-0 text-emerald-500"
                          aria-hidden="true"
                        />
                      ) : (
                        <XCircle
                          className="mt-1 size-5 shrink-0 text-red-500"
                          aria-hidden="true"
                        />
                      )}
                      <div>
                        <Badge
                          variant="outline"
                          className="mb-3 border-cyan-300/40 bg-cyan-300/10 text-cyan-100"
                        >
                          {question.category}
                        </Badge>
                        <CardTitle className="text-base leading-6 text-white">
                          {indexInDay + 1}. {question.prompt}
                        </CardTitle>
                        <p className="mt-3 text-sm text-neutral-400">
                          Your answer:{" "}
                          <span className="text-neutral-100">
                            {formatAnswerList(selectedAnswers)}
                          </span>
                        </p>
                        {!isCorrect && (
                          <p className="mt-2 text-sm text-neutral-400">
                            Correct answer{correctAnswers.length > 1 ? "s" : ""}:{" "}
                            <span className="text-emerald-400">
                              {formatAnswerList(correctAnswers)}
                            </span>
                          </p>
                        )}
                        <p className="mt-3 text-sm leading-6 text-neutral-300">
                          {question.explanation}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
