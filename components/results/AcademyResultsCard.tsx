"use client";

import { CheckCircle2, XCircle } from "lucide-react";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { isQuestionCorrect, type SelectedAnswers } from "@/lib/answer-utils";
import { getNextRecommendedPack } from "@/lib/academy-data";
import type { ExamQuestion } from "@/types/question";

type AcademyResultsCardProps = {
  questions: ExamQuestion[];
  answers: SelectedAnswers;
};

function truncate(text: string, max = 60) {
  return text.length <= max ? text : text.slice(0, max).trimEnd() + "…";
}

export function AcademyResultsCard({ questions, answers }: AcademyResultsCardProps) {
  if (questions.length === 0) return null;

  const packId = questions[0]?.academy?.id;
  const packTitle = questions[0]?.academy?.title ?? "Academy";

  // Recommended next pack: first unfinished pack after this one, in track order
  const next = packId ? getNextRecommendedPack(new Set([packId])) : null;
  const nextPack = next?.pack ?? null;

  return (
    <Card className="border border-white/10 bg-neutral-900/80 text-neutral-50 ring-0">
      <CardHeader className="px-6 py-5">
        <CardTitle className="text-lg text-white">{packTitle}</CardTitle>
        <div className="mt-1 h-px bg-white/10" />

        <ul className="mt-4 space-y-2">
          {questions.map((q) => {
            const correct = isQuestionCorrect(q, answers[q.id]);
            return (
              <li key={q.id} className="flex items-start gap-2.5 text-sm">
                {correct ? (
                  <CheckCircle2
                    className="mt-0.5 size-4 shrink-0 text-emerald-400"
                    aria-hidden="true"
                  />
                ) : (
                  <XCircle
                    className="mt-0.5 size-4 shrink-0 text-red-400"
                    aria-hidden="true"
                  />
                )}
                <span className={correct ? "text-neutral-200" : "text-neutral-400"}>
                  {truncate(q.prompt)}
                </span>
              </li>
            );
          })}
        </ul>

        {nextPack && (
          <div className="mt-3 rounded-lg border border-blue-500/20 bg-blue-500/5 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-400">
              Recommended next pack
            </p>
            <p className="mt-1 text-sm text-neutral-300">{nextPack.title}</p>
          </div>
        )}
      </CardHeader>
    </Card>
  );
}
