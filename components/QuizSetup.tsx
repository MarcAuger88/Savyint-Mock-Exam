"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Briefcase, CheckCircle2, GraduationCap, HelpCircle, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const modeIcons: Record<string, LucideIcon> = {
  Zap,
  GraduationCap,
  Briefcase,
};

import { AnalyticsOverview } from "@/components/AnalyticsOverview";
import { ReleaseNotice } from "@/components/ReleaseNotice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getLatestContinueAttempt,
  type ContinueAttempt,
} from "@/lib/quiz-draft-store";
import { buildQuizHref } from "@/lib/quiz-url";
import { quizTheme } from "@/lib/theme-tokens";
import type { QuizAnalytics } from "@/types/analytics";
import type { EngagementSummary } from "@/types/engagement";
import {
  examCategories,
  type Difficulty,
  type ExamMode,
  examModes,
  type ExamCategory,
} from "@/types/question";
import { EngagementIcon } from "./engagements/EngagementIcon";

type CategoryCounts = Record<string, number>;
type CategoryDifficultyCounts = Record<string, Record<Difficulty, number>>;
type EngagementDifficultyFilter = Difficulty | "all";

type QuestionMetadata = {
  totalItems: number;
  categoryCounts: CategoryCounts;
  categoryDifficultyCounts: CategoryDifficultyCounts;
  engagements?: EngagementSummary[];
};

const minQuestionCount = 10;
const defaultQuestionCount = 25;
const weakCategoryThreshold = 80;
const weakCategoryFallbackCount = 3;
const difficulties: Difficulty[] = ["easy", "medium", "hard", "expert"];
const difficultyLabels: Record<Difficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
  expert: "Expert",
};

function clampQuestionCount(
  value: number,
  max: number,
  min = minQuestionCount,
) {
  return Math.min(Math.max(value, min), max);
}

function getReadinessBadge(percentage?: number) {
  if (percentage === undefined) {
    return {
      label: "Untested",
      className: "border-white/10 bg-neutral-950/70 text-neutral-400",
    };
  }

  if (percentage >= 80) {
    return {
      label: `${percentage}%`,
      className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    };
  }

  if (percentage >= 60) {
    return {
      label: `${percentage}%`,
      className: "border-amber-400/30 bg-amber-400/10 text-amber-200",
    };
  }

  return {
    label: `${percentage}%`,
    className: "border-red-500/30 bg-red-500/10 text-red-300",
  };
}

function getDifficultyBadgeClass(difficulty: Difficulty) {
  if (difficulty === "easy") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  }

  if (difficulty === "medium") {
    return "border-yellow-400/30 bg-yellow-400/10 text-yellow-300";
  }

  if (difficulty === "hard") {
    return "border-orange-500/30 bg-orange-500/10 text-orange-300";
  }

  return "border-red-500/30 bg-red-500/10 text-red-300";
}

function getAverageBadgeClass(percentage?: number) {
  if (percentage === undefined) {
    return "border-white/10 bg-neutral-950/70 text-neutral-400";
  }

  if (percentage >= 80) {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  }

  if (percentage >= 60) {
    return "border-amber-400/30 bg-amber-400/10 text-amber-200";
  }

  return "border-red-500/30 bg-red-500/10 text-red-300";
}

export default function QuizSetup({ mode }: { mode: ExamMode }) {
  const [selectedCategories, setSelectedCategories] = useState<ExamCategory[]>([
    ...examCategories,
  ]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<
    Difficulty[]
  >([...difficulties]);
  const [questionCount, setQuestionCount] = useState(defaultQuestionCount);
  const [selectedEngagementId, setSelectedEngagementId] = useState<
    string | null
  >(null);
  const [expandedEngagementId, setExpandedEngagementId] = useState<
    string | null
  >(null);
  const [engagementDifficultyFilter, setEngagementDifficultyFilter] =
    useState<EngagementDifficultyFilter>("all");
  const engagementDetailsRef = useRef<HTMLElement | null>(null);
  const [engagementDetailsHeight, setEngagementDetailsHeight] = useState<
    number | null
  >(null);
  const allCategoriesSelected =
    selectedCategories.length === examCategories.length;
  const allDifficultiesSelected =
    selectedDifficulties.length === difficulties.length;
  const [metadataByMode, setMetadataByMode] = useState<Record<
    string,
    QuestionMetadata
  > | null>(null);
  const [analytics, setAnalytics] = useState<QuizAnalytics | null>(null);
  const [resettingAnalytics, setResettingAnalytics] = useState(false);
  const [continueAttempt, setContinueAttempt] =
    useState<ContinueAttempt | null>(null);
  const sortedExamCategories = useMemo(
    () => [...examCategories].sort((a, b) => a.localeCompare(b)),
    [],
  );
  const weakAndUntestedCategories = useMemo<ExamCategory[] | null>(() => {
    if (!analytics) {
      return null;
    }

    const categoryPerformance = new Map(
      analytics.byCategory.map((bucket) => [bucket.label, bucket.percentage]),
    );

    return sortedExamCategories.filter((category) => {
      const percentage = categoryPerformance.get(category);

      return percentage === undefined || percentage < weakCategoryThreshold;
    });
  }, [analytics, sortedExamCategories]);
  const categoryReadiness = useMemo(() => {
    return new Map(
      analytics?.byCategory.map((bucket) => [
        bucket.label,
        bucket.percentage,
      ]) ?? [],
    );
  }, [analytics]);
  const engagementPerformance = useMemo(() => {
    return new Map(
      analytics?.byEngagement.map((bucket) => [
        bucket.label,
        bucket.percentage,
      ]) ?? [],
    );
  }, [analytics]);
  const categoryCounts = metadataByMode?.[mode].categoryCounts ?? null;
  const categoryDifficultyCounts =
    metadataByMode?.[mode].categoryDifficultyCounts ?? null;
  const engagementOptions = useMemo(
    () => metadataByMode?.engagement?.engagements ?? [],
    [metadataByMode],
  );
  const visibleEngagementOptions = useMemo(() => {
    return engagementOptions.filter((engagement) => {
      return (
        engagementDifficultyFilter === "all" ||
        engagement.difficulty === engagementDifficultyFilter
      );
    });
  }, [engagementDifficultyFilter, engagementOptions]);
  const selectedEngagement =
    visibleEngagementOptions.find(
      (engagement) => engagement.id === selectedEngagementId,
    ) ?? null;
  const expandedEngagement =
    visibleEngagementOptions.find(
      (engagement) => engagement.id === expandedEngagementId,
    ) ?? null;
  const expandedEngagementScore = expandedEngagement
    ? engagementPerformance.get(expandedEngagement.id)
    : undefined;
  const selectedEngagementIdForHref = selectedEngagement?.id;
  const expandedEngagementContinueHref =
    mode === "engagement" &&
    expandedEngagement &&
    continueAttempt?.mode === "engagement" &&
    continueAttempt.engagementIds.includes(expandedEngagement.id)
      ? continueAttempt.href
      : null;

  const availableQuestionCount = useMemo(() => {
    if (mode !== "trivia") {
      return metadataByMode?.[mode].totalItems ?? 0;
    }

    if (!categoryDifficultyCounts) {
      if (!categoryCounts) return 0;
      return selectedCategories.reduce(
        (sum, c) => sum + (categoryCounts[c] || 0),
        0,
      );
    }

    return selectedCategories.reduce(
      (sum, category) =>
        sum +
        selectedDifficulties.reduce(
          (difficultySum, difficulty) =>
            difficultySum +
            (categoryDifficultyCounts[category]?.[difficulty] || 0),
          0,
        ),
      0,
    );
  }, [
    categoryCounts,
    categoryDifficultyCounts,
    mode,
    metadataByMode,
    selectedCategories,
    selectedDifficulties,
  ]);
  const minSelectableQuestionCount = Math.min(
    mode === "trivia" ? minQuestionCount : 1,
    Math.max(1, availableQuestionCount),
  );
  const maxQuestionCount = Math.max(
    minSelectableQuestionCount,
    availableQuestionCount,
  );
  const displayQuestionCount = clampQuestionCount(
    questionCount,
    maxQuestionCount,
    minSelectableQuestionCount,
  );
  const hasSelectedQuestionPool =
    (mode === "engagement"
      ? Boolean(selectedEngagement?.isPlayable)
      : selectedCategories.length > 0 && selectedDifficulties.length > 0) &&
    availableQuestionCount > 0;
  const countLabel = mode === "engagement" ? "engagements" : "questions";
  const countDisplayLabel =
    displayQuestionCount === 1
      ? mode === "engagement"
        ? "engagement"
        : "question"
      : countLabel;

  const startHref = buildQuizHref({
    count: mode === "engagement" ? 1 : displayQuestionCount,
    fresh: true,
    mode,
    timer: false,
    categories:
      mode === "trivia" && !allCategoriesSelected ? selectedCategories : [],
    difficulties:
      mode === "trivia" && !allDifficultiesSelected ? selectedDifficulties : [],
    engagementIds:
      mode === "engagement" && selectedEngagementIdForHref
        ? [selectedEngagementIdForHref]
        : [],
  });

  const weakCategoryExam = useMemo(() => {
    if (
      mode !== "trivia" ||
      !analytics ||
      analytics.weakCategories.length === 0 ||
      selectedDifficulties.length === 0
    ) {
      return null;
    }

    const belowThreshold = analytics.weakCategories.filter(
      (bucket) => bucket.percentage < weakCategoryThreshold,
    );
    const focusBuckets =
      belowThreshold.length > 0
        ? belowThreshold
        : analytics.weakCategories.slice(0, weakCategoryFallbackCount);
    const focusCategories = focusBuckets.map((bucket) => bucket.label);

    if (focusCategories.length === 0) {
      return null;
    }

    const availableWeakQuestionCount = categoryDifficultyCounts
      ? focusCategories.reduce(
          (sum, category) =>
            sum +
            selectedDifficulties.reduce(
              (difficultySum, difficulty) =>
                difficultySum +
                (categoryDifficultyCounts[category]?.[difficulty] || 0),
              0,
            ),
          0,
        )
      : categoryCounts
        ? focusCategories.reduce(
            (sum, category) => sum + (categoryCounts[category] || 0),
            0,
          )
        : 0;
    const weakMaxQuestionCount =
      availableWeakQuestionCount > 0
        ? Math.max(minQuestionCount, availableWeakQuestionCount)
        : defaultQuestionCount;
    const weakQuestionCount = clampQuestionCount(
      questionCount,
      weakMaxQuestionCount,
      Math.min(minQuestionCount, Math.max(1, availableWeakQuestionCount)),
    );

    return {
      href: buildQuizHref({
        count: weakQuestionCount,
        fresh: true,
        mode: mode,
        timer: false,
        categories: focusCategories,
        difficulties: allDifficultiesSelected ? [] : selectedDifficulties,
      }),
    };
  }, [
    allDifficultiesSelected,
    analytics,
    categoryCounts,
    categoryDifficultyCounts,
    mode,
    questionCount,
    selectedDifficulties,
  ]);

  useEffect(() => {
    let mounted = true;

    async function loadMeta() {
      try {
        const metaResponse = await fetch(`/api/quiz?meta=1`);
        if (!mounted) return;
        if (metaResponse.ok) {
          const json = await metaResponse.json();
          setMetadataByMode({
            trivia: {
              totalItems: json.trivia?.totalItems || 0,
              categoryCounts: json.trivia?.categoryCounts || {},
              categoryDifficultyCounts:
                json.trivia?.categoryDifficultyCounts || {},
            },
            engagement: {
              totalItems: json.engagement?.totalItems || 0,
              categoryCounts: json.engagement?.categoryCounts || {},
              categoryDifficultyCounts:
                json.engagement?.categoryDifficultyCounts || {},
              engagements: json.engagement?.engagements || [],
            },
          });
        }
      } catch {
        // ignore
      }
    }

    loadMeta();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadAnalytics() {
      try {
        const response = await fetch(`/api/analytics?mode=${mode}`);
        if (!mounted || !response.ok) return;

        const json = (await response.json()) as QuizAnalytics;
        setAnalytics(json);
      } catch {
        // ignore
      }
    }

    loadAnalytics();

    return () => {
      mounted = false;
    };
  }, [mode]);

  useEffect(() => {
    function updateContinueAttempt() {
      setContinueAttempt(getLatestContinueAttempt(minQuestionCount, mode));
    }

    const timeout = window.setTimeout(updateContinueAttempt, 0);
    window.addEventListener("storage", updateContinueAttempt);
    window.addEventListener("focus", updateContinueAttempt);

    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("storage", updateContinueAttempt);
      window.removeEventListener("focus", updateContinueAttempt);
    };
  }, [mode]);

  useEffect(() => {
    if (mode !== "engagement") {
      return;
    }

    const detailsElement = engagementDetailsRef.current;
    if (!detailsElement) {
      return;
    }

    let frameId = 0;
    const updateDetailsHeight = () => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(() => {
        setEngagementDetailsHeight(
          Math.ceil(detailsElement.getBoundingClientRect().height),
        );
      });
    };

    updateDetailsHeight();

    const observer = new ResizeObserver(updateDetailsHeight);
    observer.observe(detailsElement);
    window.addEventListener("resize", updateDetailsHeight);

    return () => {
      window.cancelAnimationFrame(frameId);
      observer.disconnect();
      window.removeEventListener("resize", updateDetailsHeight);
    };
  }, [mode, expandedEngagement, visibleEngagementOptions.length]);

  function toggleCategory(category: ExamCategory) {
    setSelectedCategories((currentCategories) =>
      currentCategories.includes(category)
        ? currentCategories.filter(
            (currentCategory) => currentCategory !== category,
          )
        : [...currentCategories, category],
    );
  }

  function toggleDifficulty(difficulty: Difficulty) {
    setSelectedDifficulties((currentDifficulties) =>
      currentDifficulties.includes(difficulty)
        ? currentDifficulties.filter(
            (currentDifficulty) => currentDifficulty !== difficulty,
          )
        : [...currentDifficulties, difficulty],
    );
  }

  function randomizeCategories() {
    const randomizedCategories = examCategories.filter(
      () => Math.random() >= 0.5,
    );

    setSelectedCategories(
      randomizedCategories.length > 0
        ? randomizedCategories
        : [examCategories[Math.floor(Math.random() * examCategories.length)]],
    );
  }

  function selectWeakAndUntestedCategories() {
    if (!weakAndUntestedCategories) {
      return;
    }

    setSelectedCategories(weakAndUntestedCategories);
  }

  async function resetScoreHistory() {
    const modeLabel =
      mode === "engagement" ? "consulting engagement" : "trivia";
    const confirmed = window.confirm(
      `Reset ${modeLabel} score history? This cannot be undone.`,
    );

    if (!confirmed) return;

    setResettingAnalytics(true);
    try {
      const response = await fetch(`/api/analytics?mode=${mode}`, {
        method: "DELETE",
      });

      if (!response.ok) return;

      const json = (await response.json()) as QuizAnalytics;
      setAnalytics(json);
    } finally {
      setResettingAnalytics(false);
    }
  }

  return (
    <main
      className="min-h-screen bg-neutral-950 text-neutral-50"
      style={{
        backgroundImage:
          "radial-gradient(ellipse 100% 45% at 50% 0%, rgb(59 130 246 / 0.09), transparent)",
      }}
    >
      <section className="mx-auto flex min-h-screen w-full max-w-[92rem] flex-col justify-center px-6 py-8 xl:px-8">
        <div className="animate-enter-up flex flex-col gap-3 sm:flex-row sm:items-center">
          <nav className="flex flex-1 gap-1 rounded-lg border border-white/10 bg-neutral-900/50 p-1">
            {examModes.map((m) => (
              <Link
                key={m.value}
                href={m.href}
                className={`group relative flex flex-1 items-center justify-center gap-1.5 rounded-md px-4 py-2 text-base font-medium transition ${
                  m.value === mode
                    ? "border border-blue-500/50 bg-blue-500/15 text-blue-100 shadow-lg shadow-blue-950/20"
                    : "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-100"
                }`}
              >
                {(() => { const Icon = modeIcons[m.icon]; return Icon ? <Icon className="size-4" aria-hidden="true" /> : null; })()}
                {m.label}
                <HelpCircle className="size-4 opacity-50" aria-hidden="true" />
                <span className="pointer-events-none absolute left-1/2 top-[calc(100%+0.5rem)] z-30 -translate-x-1/2 whitespace-nowrap rounded-md border border-white/10 bg-neutral-950 px-3 py-2 text-sm font-normal text-neutral-200 opacity-0 shadow-xl shadow-black/30 transition group-hover:opacity-100 group-focus-visible:opacity-100">
                  {m.description}
                </span>
              </Link>
            ))}
          </nav>
        </div>

        {mode === "trivia" && (
          <div className="animate-enter-up mt-8 [animation-delay:120ms]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-medium text-white">
                  Categories to be included
                </h2>
                <p className="mt-1 text-sm text-neutral-400">
                  {selectedCategories.length} of {examCategories.length}{" "}
                  selected
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="border-white/15 bg-neutral-950 text-neutral-100 hover:bg-neutral-900"
                  onClick={() => setSelectedCategories([...examCategories])}
                >
                  All
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="border-white/15 bg-neutral-950 text-neutral-100 hover:bg-neutral-900"
                  onClick={randomizeCategories}
                >
                  Randomize
                </Button>
                {analytics && analytics.totalAttempts > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    className="border-white/15 bg-neutral-950 text-neutral-100 hover:bg-neutral-900 disabled:cursor-not-allowed disabled:opacity-40"
                    onClick={selectWeakAndUntestedCategories}
                    disabled={
                      !weakAndUntestedCategories ||
                      weakAndUntestedCategories.length === 0
                    }
                  >
                    Least successful
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  className="border-white/15 bg-neutral-950 text-neutral-100 hover:bg-neutral-900"
                  onClick={() => setSelectedCategories([])}
                >
                  Clear
                </Button>
              </div>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5">
              {sortedExamCategories.map((category) => {
                const isSelected = selectedCategories.includes(category);
                const readiness = getReadinessBadge(
                  categoryReadiness.get(category),
                );

                return (
                  <label
                    key={category}
                    className={`flex min-h-10 cursor-pointer items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm leading-5 transition ${
                      isSelected
                        ? quizTheme.selectedCategory
                        : "border-white/10 bg-neutral-900/50 text-neutral-300 opacity-45 hover:border-white/25 hover:bg-neutral-900 hover:opacity-80"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleCategory(category)}
                      className="size-4 shrink-0 accent-emerald-600"
                    />
                    <span className="min-w-0 flex-1">{category}</span>
                    <span
                      className={`shrink-0 rounded-full border px-2 py-0.5 text-[0.7rem] leading-4 ${readiness.className}`}
                    >
                      {readiness.label}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {mode === "engagement" ? (
          <div className="animate-enter-up mt-12 [animation-delay:160ms]">
            <div className="flex items-start gap-5">
              <div
                className="flex w-[27rem] shrink-0 flex-col"
                style={
                  engagementDetailsHeight
                    ? { height: engagementDetailsHeight }
                    : undefined
                }
              >
                <div className="flex min-h-0 flex-1 flex-col gap-3 pr-1">
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="min-w-[5.5rem] text-base font-medium text-neutral-400">
                        Difficulty
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {(
                          [
                            "all",
                            ...difficulties,
                          ] as EngagementDifficultyFilter[]
                        ).map((difficulty) => {
                          const isSelected =
                            engagementDifficultyFilter === difficulty;

                          return (
                            <button
                              key={difficulty}
                              type="button"
                              aria-pressed={isSelected}
                              onClick={() =>
                                setEngagementDifficultyFilter(difficulty)
                              }
                              className={`rounded-md border px-3 py-1.5 text-sm font-medium transition ${
                                isSelected
                                  ? "border-blue-500/50 bg-blue-500/15 text-blue-100"
                                  : "border-white/10 bg-neutral-950 text-neutral-400 hover:border-white/25 hover:bg-neutral-900 hover:text-neutral-100"
                              }`}
                            >
                              {difficulty === "all"
                                ? "All"
                                : difficultyLabels[difficulty]}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="grid min-h-0 flex-1 content-start gap-3 overflow-y-auto pr-1">
                    {visibleEngagementOptions.map((engagement) => {
                      const isSelected =
                        selectedEngagement?.id === engagement.id;
                      const isCompleted =
                        engagementPerformance.get(engagement.id) === 100;
                      return (
                        <button
                          key={engagement.id}
                          type="button"
                          disabled={!engagement.isPlayable}
                          data-testid={
                            engagement.isPlayable
                              ? "engagement-option"
                              : undefined
                          }
                          onClick={() => {
                            if (!engagement.isPlayable) return;
                            setSelectedEngagementId(engagement.id);
                            setExpandedEngagementId(engagement.id);
                          }}
                          className={`relative min-h-28 overflow-hidden rounded-lg border p-4 text-left transition ${
                            isSelected
                              ? "border-blue-500/50 bg-blue-500/15 shadow-lg shadow-blue-950/20"
                              : engagement.isPlayable
                                ? "border-white/10 bg-neutral-900/60 hover:border-white/25 hover:bg-neutral-900"
                                : "cursor-not-allowed border-white/10 bg-neutral-950/70 opacity-45"
                          } ${isCompleted && !isSelected ? "opacity-60" : ""}`}
                        >
                          <div className="grid h-full grid-cols-[4.5rem_minmax(0,1fr)] items-center gap-4">
                            <div className="flex size-16 shrink-0 items-center justify-center rounded-lg border border-blue-400/20 bg-blue-400/10">
                              <EngagementIcon
                                name={engagement.visuals?.icon}
                                className="h-11 w-11 text-blue-300"
                              />
                            </div>
                            <div className="min-w-0">
                              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                                <div className="min-w-0">
                                  <p className="min-w-0 break-words text-sm font-semibold leading-5 text-white">
                                    {engagement.title}
                                  </p>
                                  <p className="mt-0.5 break-words text-sm leading-5 text-neutral-400">
                                    {engagement.customer.name}
                                  </p>
                                </div>
                                <div className="flex flex-col items-end gap-1.5">
                                  {!engagement.isPlayable && (
                                    <span className="whitespace-nowrap rounded-full border border-white/10 bg-neutral-900 px-2 py-0.5 text-xs text-neutral-500">
                                      Outline
                                    </span>
                                  )}
                                  {isCompleted && (
                                    <CheckCircle2
                                      className="size-7 shrink-0 text-emerald-400"
                                      aria-label="Completed"
                                    />
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                    {visibleEngagementOptions.length === 0 && (
                      <div className="rounded-lg border border-white/10 bg-neutral-900/60 p-4 text-sm text-neutral-400">
                        No engagements match the selected filters.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {expandedEngagement && (
                <section
                  ref={engagementDetailsRef}
                  className="min-w-0 flex-1 self-start rounded-xl border border-white/10 bg-neutral-900/70 p-5 shadow-2xl shadow-black/20"
                >
                  <div className="min-w-0">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-md font-semibold uppercase tracking-wide text-blue-300">
                          Engagement Details
                        </p>
                        {expandedEngagementScore !== undefined && (
                          <span
                            className={`inline-flex rounded-full border px-2 py-0.5 text-sm font-medium ${getAverageBadgeClass(expandedEngagementScore)}`}
                          >
                            {expandedEngagementScore === 100
                              ? "Completed 100%"
                              : `Last attempt ${expandedEngagementScore}%`}
                          </span>
                        )}
                      </div>
                      {expandedEngagement.isPlayable && (
                        <Button
                          asChild
                          size="lg"
                          variant="outline"
                          className={`h-11 px-5 text-base ${quizTheme.primaryAction}`}
                        >
                          <Link
                            href={expandedEngagementContinueHref ?? startHref}
                            data-testid="start-engagement"
                          >
                            {expandedEngagementContinueHref
                              ? "Continue Last Attempt"
                              : expandedEngagementScore === 100
                                ? "Replay Engagement"
                                : expandedEngagementScore !== undefined
                                  ? "Start New Engagement"
                                  : "Start New Engagement"}
                          </Link>
                        </Button>
                      )}
                    </div>
                    <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex flex-wrap gap-x-6 gap-y-1 text-lg text-neutral-300">
                        <p>
                          <span className="font-medium text-neutral-500">
                            Industry:
                          </span>{" "}
                          {expandedEngagement.customer.industry}
                        </p>
                        <p>
                          <span className="font-medium text-neutral-500">
                            Employees:
                          </span>{" "}
                          {expandedEngagement.customer.employeeCount.toLocaleString()}
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-neutral-500">
                            Difficulty:
                          </span>
                          <span
                            className={`inline-flex rounded-full border px-2 py-0.5 text-sm font-medium ${getDifficultyBadgeClass(
                              expandedEngagement.difficulty,
                            )}`}
                          >
                            {difficultyLabels[expandedEngagement.difficulty]}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="mt-4 text-lg leading-8 text-neutral-300">
                      {expandedEngagement.summary}
                    </p>
                    {expandedEngagement.introduction && (
                      <div className="mt-4">
                        <p className="text-base font-medium uppercase tracking-wide text-neutral-500">
                          Context
                        </p>
                        <p className="mt-2 text-base leading-7 text-neutral-300">
                          {expandedEngagement.introduction}
                        </p>
                      </div>
                    )}

                    {expandedEngagement.customer.currentProblems.length > 0 && (
                      <div className="mt-4">
                        <p className="text-base font-medium uppercase tracking-wide text-neutral-500">
                          Current Problems
                        </p>
                        <ul className="mt-2 grid gap-2 text-base text-neutral-300">
                          {expandedEngagement.customer.currentProblems.map(
                            (problem) => (
                              <li key={problem} className="flex gap-2">
                                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-blue-300" />
                                <span>{problem}</span>
                              </li>
                            ),
                          )}
                        </ul>
                      </div>
                    )}

                    {expandedEngagement.phases.length > 0 && (
                      <div className="mt-6">
                        <p className="text-sm font-medium uppercase tracking-wide text-neutral-500">
                          Engagement Phases
                        </p>
                        <div className="mt-3 space-y-3">
                          {expandedEngagement.phases.map((phase) => (
                            <div
                              key={phase.id}
                              className="rounded-lg border border-white/10 bg-neutral-950/60 p-3"
                            >
                              <div className="flex items-start gap-3">
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-white">
                                    {phase.order}. {phase.title}
                                  </p>
                                  {phase.scenario && (
                                    <p className="mt-1 text-sm leading-6 text-neutral-400">
                                      {phase.scenario}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              )}
              {!expandedEngagement && (
                <section
                  ref={engagementDetailsRef}
                  className="min-h-[62rem] min-w-0 flex-1 self-start rounded-xl border border-white/10 bg-neutral-900/70 p-5 shadow-2xl shadow-black/20"
                >
                  <div className="flex h-full min-h-[59.5rem] items-center justify-center rounded-lg border border-dashed border-white/10 bg-neutral-950/30 px-6 py-10 text-center">
                    <p className="text-lg font-medium text-neutral-300">
                      Select a scenario to explore its details
                    </p>
                  </div>
                </section>
              )}
            </div>
          </div>
        ) : (
          <div className="animate-enter-up mt-12 [animation-delay:160ms]">
            <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-start">
              <div className="min-w-0">
                <h2 className="text-base font-medium text-white">
                  Number of questions
                </h2>
                <p className="mt-1 text-sm text-neutral-400">
                  {selectedCategories.length === 0
                    ? "Select at least one category to choose an exam length"
                    : selectedDifficulties.length === 0
                      ? "Select at least one difficulty to choose an exam length"
                      : availableQuestionCount === 0
                        ? "No questions match the selected category and difficulty filters"
                        : `Choose between ${minSelectableQuestionCount} and ${availableQuestionCount} ${countLabel}`}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:justify-center">
                <p className="mr-1 text-sm font-medium text-neutral-300">
                  Filter by difficulty
                </p>
                <div className="flex flex-wrap gap-2">
                  {difficulties.map((difficulty) => {
                    const isSelected =
                      selectedDifficulties.includes(difficulty);

                    return (
                      <button
                        key={difficulty}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => toggleDifficulty(difficulty)}
                        className={`rounded-md border px-3 py-2 text-sm font-medium transition ${
                          isSelected
                            ? "border-blue-500/50 bg-blue-500/15 text-blue-100 shadow-lg shadow-blue-950/20"
                            : "border-white/10 bg-neutral-950 text-neutral-400 opacity-60 hover:border-white/25 hover:bg-neutral-900 hover:opacity-90"
                        }`}
                      >
                        {difficultyLabels[difficulty]}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-neutral-300 sm:mt-2 sm:justify-end">
                <span>{displayQuestionCount}</span>
                <span>{countDisplayLabel}</span>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_7rem] sm:items-center">
              <input
                type="range"
                min={minSelectableQuestionCount}
                max={maxQuestionCount}
                value={displayQuestionCount}
                onChange={(event) =>
                  setQuestionCount(
                    clampQuestionCount(
                      Number(event.currentTarget.value),
                      maxQuestionCount,
                      minSelectableQuestionCount,
                    ),
                  )
                }
                disabled={!hasSelectedQuestionPool}
                className="h-2 w-full cursor-pointer accent-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
              />
              <Input
                type="number"
                min={minSelectableQuestionCount}
                max={maxQuestionCount}
                value={displayQuestionCount}
                onChange={(event) =>
                  setQuestionCount(
                    clampQuestionCount(
                      Number(event.currentTarget.value),
                      maxQuestionCount,
                      minSelectableQuestionCount,
                    ),
                  )
                }
                disabled={!hasSelectedQuestionPool}
                className="h-11 border-white/15 bg-neutral-950 text-neutral-100"
              />
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {mode !== "engagement" &&
            (!hasSelectedQuestionPool ? (
              <Button
                type="button"
                size="lg"
                variant="outline"
                className={`h-11 px-5 text-base ${quizTheme.primaryAction}`}
                disabled
              >
                Start New Exam
              </Button>
            ) : (
              <Button
                asChild
                size="lg"
                variant="outline"
                className={`h-11 px-5 text-base ${quizTheme.primaryAction}`}
              >
                <Link href={startHref} data-testid="start-trivia">
                  Start New Exam
                </Link>
              </Button>
            ))}
          {continueAttempt && mode !== "engagement" && (
            <Button
              asChild
              size="lg"
              variant="outline"
              className={`h-11 px-5 text-base sm:ml-auto ${quizTheme.primaryAction}`}
            >
              <Link href={continueAttempt.href}>Continue Last Attempt</Link>
            </Button>
          )}
        </div>

        {mode !== "engagement" && (
          <AnalyticsOverview
            analytics={analytics}
            weakCategoriesExamHref={weakCategoryExam?.href}
          />
        )}

        {mode !== "engagement" && analytics && analytics.totalAttempts > 0 && (
          <div className="mt-16 flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={resetScoreHistory}
              disabled={resettingAnalytics}
              className="border-red-500/30 bg-neutral-950 text-red-300 hover:bg-red-950/30 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {resettingAnalytics ? "Resetting..." : "Reset Score History"}
            </Button>
          </div>
        )}

        <ReleaseNotice />
      </section>
    </main>
  );
}
