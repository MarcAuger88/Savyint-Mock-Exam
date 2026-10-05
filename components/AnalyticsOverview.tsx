"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Activity, BarChart3, Target } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { quizTheme } from "@/lib/theme-tokens";
import type { PerformanceBucket, QuizAnalytics } from "@/types/analytics";

type AnalyticsOverviewProps = {
  analytics: QuizAnalytics | null;
  weakCategoriesExamHref?: string | null;
};

function formatAttemptDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function BucketList({
  buckets,
  emptyLabel,
  formatLabel = (label) => label,
}: {
  buckets: PerformanceBucket[];
  emptyLabel: string;
  formatLabel?: (label: string) => string;
}) {
  if (buckets.length === 0) {
    return <p className="text-sm text-neutral-500">{emptyLabel}</p>;
  }

  return (
    <div className="space-y-5">
      {buckets.map((bucket) => (
        <div key={bucket.label} className="space-y-1.5">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-medium text-neutral-100">
              {formatLabel(bucket.label)}
            </span>
            <span className="text-neutral-400">
              {bucket.earnedPoints}/{bucket.totalPoints} pts
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Progress
              value={bucket.percentage}
              className={`h-2 bg-neutral-800 ${getProgressColor(bucket.percentage)}`}
            />
            <span className="w-10 text-right text-sm text-neutral-300">
              {bucket.percentage}%
            </span>
          </div>
          <p className="text-xs text-neutral-400">
            {bucket.correct}/{bucket.totalQuestions} correct
          </p>
        </div>
      ))}
    </div>
  );
}

function capitalizeLabel(label: string) {
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function getProgressColor(percentage: number) {
  if (percentage >= 80) {
    return "[&_[data-slot=progress-indicator]]:bg-emerald-500";
  }

  if (percentage >= 60) {
    return "[&_[data-slot=progress-indicator]]:bg-amber-300";
  }

  return "[&_[data-slot=progress-indicator]]:bg-red-500";
}

export function AnalyticsOverview({
  analytics,
  weakCategoriesExamHref,
}: AnalyticsOverviewProps) {
  const rightColumnRef = useRef<HTMLDivElement | null>(null);
  const [rightColumnHeight, setRightColumnHeight] = useState<number | null>(
    null,
  );

  useEffect(() => {
    if (!analytics || analytics.totalAttempts === 0) {
      return;
    }

    const rightColumn = rightColumnRef.current;
    if (!rightColumn) {
      return;
    }

    let frameId = 0;
    const updateHeight = () => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(() => {
        setRightColumnHeight(
          Math.ceil(rightColumn.getBoundingClientRect().height),
        );
      });
    };

    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    observer.observe(rightColumn);
    window.addEventListener("resize", updateHeight);

    return () => {
      window.cancelAnimationFrame(frameId);
      observer.disconnect();
      window.removeEventListener("resize", updateHeight);
    };
  }, [analytics]);

  if (!analytics || analytics.totalAttempts === 0) {
    return (
      <section className="mt-10 border-t border-white/10 pt-6">
        <div className="flex items-center gap-3">
          <div
            className={`flex size-10 items-center justify-center rounded-lg border ${quizTheme.primaryIcon}`}
          >
            <Activity className="size-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-medium text-white">
              Performance History
            </h2>
            <p className="mt-1 text-sm text-neutral-400">
              Complete an exam to start tracking weak areas.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-10 border-t border-white/10 pt-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`flex size-12 items-center justify-center rounded-lg border ${quizTheme.primaryIcon}`}
          >
            <BarChart3 className="size-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-medium text-white">
              Performance History
            </h2>
            <p className="mt-1 text-sm text-neutral-400">
              {analytics.totalAttempts} attempts /{" "}
              {analytics.totalQuestionsAnswered} questions answered
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm sm:min-w-72">
          <div className="rounded-lg border border-white/10 bg-neutral-900/60 px-3 py-2">
            <p className="text-neutral-500">Average</p>
            <p className="mt-1 text-lg font-semibold text-white">
              {analytics.averageScore}%
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-neutral-900/60 px-3 py-2">
            <p className="text-neutral-500">Pass rate</p>
            <p className="mt-1 text-lg font-semibold text-white">
              {analytics.passRate}%
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 grid items-start gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div
          className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-white/10 bg-neutral-900/60 p-4"
          style={
            rightColumnHeight
              ? { height: rightColumnHeight }
              : undefined
          }
        >
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Target className="size-4 text-red-400" aria-hidden="true" />
              <h3 className="font-medium text-white">Weakest Categories</h3>
            </div>
            {weakCategoriesExamHref && (
              <div className="group relative">
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className={`h-9 px-4 text-base ${quizTheme.primaryAction}`}
                >
                  <Link href={weakCategoriesExamHref}>
                    Practice Weak Areas
                  </Link>
                </Button>
                <span className="pointer-events-none absolute right-0 top-[calc(100%+0.5rem)] z-30 whitespace-nowrap rounded-md border border-white/10 bg-neutral-950 px-3 py-2 text-sm font-normal text-neutral-200 opacity-0 shadow-xl shadow-black/30 transition group-hover:opacity-100 group-focus-within:opacity-100">
                  Generate an exam based your weakest results
                </span>
              </div>
            )}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto pr-2">
            <BucketList
              buckets={analytics.weakCategories}
              emptyLabel="No category data yet."
            />
          </div>
        </div>

        <div ref={rightColumnRef} className="flex flex-col gap-4">
          <div className="rounded-lg border border-white/10 bg-neutral-900/60 p-4">
            <h3 className="mb-4 font-medium text-white">
              Difficulty Performance
            </h3>
            <BucketList
              buckets={analytics.byDifficulty}
              emptyLabel="No difficulty data yet."
              formatLabel={capitalizeLabel}
            />
          </div>

          <div className="rounded-lg border border-white/10 bg-neutral-900/60 p-4">
            <h3 className="mb-4 font-medium text-white">Recent Attempts</h3>
            <div className="max-h-[14rem] space-y-2 overflow-y-auto pr-2">
              {analytics.recentAttempts.map((attempt) => (
                <div
                  key={attempt.id}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <div>
                    <p className="text-neutral-100">
                      {attempt.earnedPoints}/{attempt.totalPoints} pts
                    </p>
                    <p className="text-xs text-neutral-500">
                      {formatAttemptDate(attempt.completedAt)}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      attempt.passed
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                        : "border-red-500/40 bg-red-500/10 text-red-400"
                    }
                  >
                    {attempt.percentage}%
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
