import { CheckCircle2, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import type { QuestionReviewItem } from "@/components/results/types";
import {
  formatAnswerList,
  getCorrectAnswers,
} from "@/lib/answer-utils";

type QuestionReviewListProps = {
  reviewItems: QuestionReviewItem[];
};

export function QuestionReviewList({ reviewItems }: QuestionReviewListProps) {
  return (
    <div className="space-y-3">
      {reviewItems.map(({
        question,
        selectedAnswers,
        isCorrect,
        originalIndex,
      }) => {
        const correctAnswers = getCorrectAnswers(question);

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
                    {originalIndex + 1}. {question.prompt}
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
}
