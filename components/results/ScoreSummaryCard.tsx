import { RotateCcw, Sparkles, Trophy } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

type ScoreSummaryCardProps = {
  correctCount: number;
  earnedPoints: number;
  elapsedLabel?: string;
  mode?: string;
  passed: boolean;
  percentage: number;
  totalPoints: number;
  totalQuestions: number;
  onRetake: () => void;
};

export function ScoreSummaryCard({
  correctCount,
  earnedPoints,
  elapsedLabel,
  mode,
  passed,
  percentage,
  totalPoints,
  totalQuestions,
  onRetake,
}: ScoreSummaryCardProps) {
  return (
    <Card
      className={`relative border text-neutral-50 ring-0 ${
        passed
          ? "celebration-score-card border-emerald-500/30 bg-neutral-900"
          : "border-white/10 bg-neutral-900"
      }`}
    >
      <CardHeader className="px-6 pt-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="relative z-10">
            <Badge
              variant="outline"
              className={
                passed
                  ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                  : "border-red-500/50 text-red-400"
              }
            >
              {passed && <Sparkles className="size-3" aria-hidden="true" />}
              {passed ? "Pass" : "Fail"}
            </Badge>
            <CardTitle className="mt-4 flex flex-wrap items-center gap-3 text-3xl text-white">
              {passed && (
                <span className="celebration-trophy flex size-11 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                  <Trophy className="size-6" aria-hidden="true" />
                </span>
              )}
              {earnedPoints}/{totalPoints} points
            </CardTitle>
            <div className="mt-5 flex flex-wrap gap-2 text-sm">
              <ScoreMetric label="Correct" value={`${correctCount}/${totalQuestions}`} />
              <ScoreMetric label="Score" value={`${percentage}%`} />
              {elapsedLabel && <ScoreMetric label="Time" value={elapsedLabel} />}
            </div>
          </div>
          <div className="relative z-10 flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onRetake}
              className="border-white/15 bg-neutral-950 text-neutral-100 hover:bg-neutral-800"
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              Retake
            </Button>
            <Button asChild className="bg-emerald-500 text-white hover:bg-emerald-400">
              <Link href={mode === "engagement" ? "/consulting" : "/"}>
                {mode === "engagement" ? "Leave engagement" : "Home"}
              </Link>
            </Button>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}

function ScoreMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-neutral-950/50 px-3 py-2">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="mt-1 font-semibold text-white">{value}</p>
    </div>
  );
}
