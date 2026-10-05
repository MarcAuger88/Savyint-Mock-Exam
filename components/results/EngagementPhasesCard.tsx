import { useMemo } from "react";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { isQuestionCorrect, type SelectedAnswers } from "@/lib/answer-utils";
import { difficultyPointValue } from "@/lib/exam-data";
import type { ExamQuestion } from "@/types/question";

type PhaseResult = {
  dayId: string;
  dayNumber: number;
  title: string;
  correct: number;
  total: number;
  earnedPoints: number;
  totalPoints: number;
  percentage: number;
};

type EngagementPhasesCardProps = {
  questions: ExamQuestion[];
  answers: SelectedAnswers;
};

function getScoreColor(percentage: number) {
  if (percentage >= 80) return "text-emerald-400";
  if (percentage >= 60) return "text-amber-400";
  return "text-red-400";
}

function getProgressColor(percentage: number) {
  if (percentage >= 80) return "[&>div]:bg-emerald-500";
  if (percentage >= 60) return "[&>div]:bg-amber-500";
  return "[&>div]:bg-red-500";
}

export function EngagementPhasesCard({
  questions,
  answers,
}: EngagementPhasesCardProps) {
  const phases = useMemo<PhaseResult[]>(() => {
    const phaseMap = new Map<
      string,
      { dayNumber: number; title: string; questions: ExamQuestion[] }
    >();

    for (const question of questions) {
      if (!question.engagement) continue;
      const { day } = question.engagement;
      if (!phaseMap.has(day.id)) {
        phaseMap.set(day.id, {
          dayNumber: day.dayNumber,
          title: day.title,
          questions: [],
        });
      }
      phaseMap.get(day.id)!.questions.push(question);
    }

    return [...phaseMap.values()]
      .sort((a, b) => a.dayNumber - b.dayNumber)
      .map(({ dayNumber, title, questions: phaseQuestions }) => {
        const correct = phaseQuestions.filter((q) =>
          isQuestionCorrect(q, answers[q.id]),
        ).length;
        const total = phaseQuestions.length;
        const earnedPoints = phaseQuestions.reduce(
          (sum, q) =>
            isQuestionCorrect(q, answers[q.id])
              ? sum + difficultyPointValue[q.difficulty]
              : sum,
          0,
        );
        const totalPoints = phaseQuestions.reduce(
          (sum, q) => sum + difficultyPointValue[q.difficulty],
          0,
        );
        const percentage =
          totalPoints === 0
            ? 0
            : Math.round((earnedPoints / totalPoints) * 100);

        return {
          dayId: `day-${dayNumber}`,
          dayNumber,
          title,
          correct,
          total,
          earnedPoints,
          totalPoints,
          percentage,
        };
      });
  }, [questions, answers]);

  if (phases.length === 0) return null;

  return (
    <Card className="border border-white/10 bg-neutral-900/80 text-neutral-50 ring-0">
      <CardHeader className="px-6 py-5">
        <CardTitle className="text-lg text-white">Phase Breakdown</CardTitle>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {phases.map((phase) => (
            <div
              key={phase.dayId}
              className="rounded-lg border border-white/10 bg-neutral-950/50 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    Day {phase.dayNumber}
                  </p>
                  <p className="mt-0.5 text-sm font-medium leading-5 text-blue-300">
                    {phase.title}
                  </p>
                </div>
                <span
                  className={`shrink-0 text-sm font-semibold ${getScoreColor(phase.percentage)}`}
                >
                  {phase.percentage}%
                </span>
              </div>
              <p className="mt-2 text-xs text-neutral-500">
                {phase.correct}/{phase.total} correct &middot;{" "}
                {phase.earnedPoints}/{phase.totalPoints} pts
              </p>
              <Progress
                value={phase.percentage}
                className={`mt-3 h-2 bg-neutral-800 ${getProgressColor(phase.percentage)}`}
              />
            </div>
          ))}
        </div>
      </CardHeader>
    </Card>
  );
}
