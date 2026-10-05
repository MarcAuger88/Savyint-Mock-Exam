"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Clock,
  GraduationCap,
  HelpCircle,
  Lock,
  PartyPopper,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const modeIcons: Record<string, LucideIcon> = { Zap, GraduationCap, Briefcase };

import { ReleaseNotice } from "@/components/ReleaseNotice";
import { Progress } from "@/components/ui/progress";
import {
  academyCategories,
  academyTrackViews,
  getNextRecommendedPack,
} from "@/lib/academy-data";
import { passingPercentage } from "@/lib/exam-constants";
import {
  getLatestContinueAttempt,
  type ContinueAttempt,
} from "@/lib/quiz-draft-store";
import { buildQuizHref } from "@/lib/quiz-url";
import type { QuizAnalytics } from "@/types/analytics";
import { examModes } from "@/types/question";

const packDifficulties = ["easy", "medium", "hard", "expert"] as const;
type PackDifficultyFilter = (typeof packDifficulties)[number] | "all";
const packDifficultyLabels: Record<(typeof packDifficulties)[number], string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
  expert: "Expert",
};

function difficultyBadgeClass(difficulty: string) {
  switch (difficulty) {
    case "easy":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
    case "medium":
      return "border-yellow-400/30 bg-yellow-400/10 text-yellow-300";
    case "hard":
      return "border-orange-500/30 bg-orange-500/10 text-orange-300";
    case "expert":
      return "border-red-500/30 bg-red-500/10 text-red-300";
    default:
      return "border-white/10 bg-neutral-900/50 text-neutral-400";
  }
}

export default function AcademyPage() {
  const [difficultyFilter, setDifficultyFilter] =
    useState<PackDifficultyFilter>("all");
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);
  const [packPerformance, setPackPerformance] = useState<Map<string, number>>(
    new Map(),
  );
  const [continueAttempt, setContinueAttempt] =
    useState<ContinueAttempt | null>(null);

  useEffect(() => {
    fetch("/api/analytics?mode=academy")
      .then((r) => (r.ok ? r.json() : null))
      .then((json: QuizAnalytics | null) => {
        if (!json) return;
        setPackPerformance(
          new Map(json.byEngagement.map((b) => [b.label, b.percentage])),
        );
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    function updateContinueAttempt() {
      setContinueAttempt(getLatestContinueAttempt(1, "academy"));
    }

    const timeout = window.setTimeout(updateContinueAttempt, 0);
    window.addEventListener("storage", updateContinueAttempt);
    window.addEventListener("focus", updateContinueAttempt);

    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("storage", updateContinueAttempt);
      window.removeEventListener("focus", updateContinueAttempt);
    };
  }, []);

  const passedPackIds = useMemo(
    () =>
      new Set(
        [...packPerformance.entries()]
          .filter(([, score]) => score >= passingPercentage)
          .map(([packId]) => packId),
      ),
    [packPerformance],
  );

  // A tier unlocks once every pack in the tier before it has a passing grade. Easy is always unlocked.
  const unlockedDifficulties = useMemo(() => {
    const unlocked = new Set<(typeof packDifficulties)[number]>(["easy"]);

    for (let i = 1; i < packDifficulties.length; i += 1) {
      const priorTierPacks = academyCategories.filter(
        (p) => p.difficulty === packDifficulties[i - 1],
      );
      const priorTierPassed = priorTierPacks.every((p) =>
        passedPackIds.has(p.packId),
      );

      if (!priorTierPassed) break;
      unlocked.add(packDifficulties[i]);
    }

    return unlocked;
  }, [passedPackIds]);

  const isPackLocked = useCallback(
    (pack: (typeof academyCategories)[number]) =>
      !unlockedDifficulties.has(pack.difficulty as (typeof packDifficulties)[number]),
    [unlockedDifficulties],
  );

  const recommended = useMemo(
    () => getNextRecommendedPack(passedPackIds, (pack) => !isPackLocked(pack)),
    [passedPackIds, isPackLocked],
  );

  const renderAcademyPackButton = (item: (typeof academyCategories)[number]) => {
    const isSelected = selectedPackId === item.packId;
    const score = packPerformance.get(item.packId);
    const isComplete = score !== undefined && score >= passingPercentage;
    const isRecommended = recommended?.pack.packId === item.packId;
    const isLocked = isPackLocked(item);
    const priorTierIndex = packDifficulties.indexOf(
      item.difficulty as (typeof packDifficulties)[number],
    ) - 1;
    const priorTierLabel =
      priorTierIndex >= 0 ? packDifficultyLabels[packDifficulties[priorTierIndex]] : null;

    const startHref = buildQuizHref({
      mode: "academy",
      count: item.questionCount,
      engagementIds: [item.packId],
      fresh: true,
    });

    return (
      <article
        key={item.packId}
        title={
          isLocked && priorTierLabel
            ? `Complete every ${priorTierLabel} pack to unlock`
            : undefined
        }
        className={`rounded-lg border p-4 text-left transition hover:-translate-y-0.5 ${
          isLocked
            ? "cursor-not-allowed border-white/10 bg-neutral-950/70 opacity-45 hover:translate-y-0"
            : isSelected
              ? "border-blue-500/50 bg-blue-500/15 shadow-lg shadow-blue-950/20"
              : isRecommended
                ? "border-blue-500/30 bg-neutral-900/50 hover:border-white/25 hover:bg-neutral-900"
                : "border-white/10 bg-neutral-900/50 hover:border-white/25 hover:bg-neutral-900"
        }`}
      >
        <button
          type="button"
          data-testid={!isLocked ? "academy-pack" : undefined}
          disabled={isLocked}
          onClick={() => {
            if (isLocked) return;
            setSelectedPackId(item.packId);
          }}
          className="w-full text-left disabled:cursor-not-allowed"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              {isLocked ? (
                <Lock className="size-6 shrink-0 text-neutral-600" aria-hidden="true" />
              ) : (
                <GraduationCap
                  className={`size-6 shrink-0 ${isSelected ? "text-blue-300" : "text-neutral-500"}`}
                  aria-hidden="true"
                />
              )}
              <span
                className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${difficultyBadgeClass(item.difficulty)}`}
              >
                {item.difficulty}
              </span>
              {!isLocked && score !== undefined && !isComplete && (
                <span className={`text-xs font-medium ${score >= 70 ? "text-emerald-400" : score >= 50 ? "text-amber-400" : "text-red-400"}`}>
                  {score}%
                </span>
              )}
              {isComplete && (
                <CheckCircle2 className="size-4 text-emerald-400" aria-hidden="true" />
              )}
            </div>
            <div className="flex flex-col items-end gap-0.5">
              {item.estimatedMinutes && (
                <span className="flex items-center gap-1 text-xs text-neutral-500">
                  <Clock className="size-3" aria-hidden="true" />
                  {item.estimatedMinutes}m
                </span>
              )}
              <span className="text-xs text-neutral-500">
                {item.questionCount} question{item.questionCount !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </button>
        <div className="mt-1 flex items-end justify-between gap-3">
          <button
            type="button"
            disabled={isLocked}
            onClick={() => {
              if (isLocked) return;
              setSelectedPackId(item.packId);
            }}
            className="min-w-0 flex-1 text-left disabled:cursor-not-allowed"
          >
            <p
              className={`text-sm font-semibold leading-5 ${isSelected ? "text-blue-100" : "text-white"}`}
            >
              {item.category}
            </p>
            <p className="text-xs text-neutral-400">{item.title}</p>
          </button>
          {isSelected && !isLocked && (
            <Link
              href={
                continueAttempt?.engagementIds.includes(item.packId)
                  ? continueAttempt.href
                  : startHref
              }
              data-testid="start-academy"
              className="mt-2 shrink-0 rounded-lg border border-emerald-600/40 bg-emerald-600/10 px-4 py-2 text-sm font-medium text-emerald-200 transition hover:bg-emerald-600/20 hover:text-emerald-100"
            >
              {continueAttempt?.engagementIds.includes(item.packId)
                ? "Continue Last Attempt"
                : "Start"}
            </Link>
          )}
        </div>
        <div className="mt-1">
          {isLocked && (
            <span className="mt-1 inline-flex w-fit items-center gap-1 rounded-full border border-white/10 bg-neutral-900 px-2 py-0.5 text-[11px] font-medium text-neutral-500">
              Locked
            </span>
          )}
          {!isLocked && isRecommended && !isSelected && (
            <span className="mt-1 inline-flex w-fit items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium text-blue-300">
              Up next
            </span>
          )}
        </div>
      </article>
    );
  };

  return (
    <main
      className="min-h-screen bg-neutral-950 text-neutral-50"
      style={{
        backgroundImage:
          "radial-gradient(ellipse 100% 45% at 50% 0%, rgb(59 130 246 / 0.09), transparent)",
      }}
    >
      <section className="mx-auto w-full max-w-[92rem] px-6 py-8 xl:px-8">
        <nav className="animate-enter-up flex gap-1 rounded-lg border border-white/10 bg-neutral-900/50 p-1">
          {examModes.map((m) => (
            <Link
              key={m.value}
              href={m.href}
              className={`group relative flex flex-1 items-center justify-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition ${
                m.value === "academy"
                  ? "border border-blue-500/50 bg-blue-500/15 text-blue-100 shadow-lg shadow-blue-950/20"
                  : "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-100"
              }`}
            >
              {(() => { const Icon = modeIcons[m.icon]; return Icon ? <Icon className="size-4" aria-hidden="true" /> : null; })()}
              {m.label}
              <HelpCircle className="size-3.5 opacity-50" aria-hidden="true" />
              <span className="pointer-events-none absolute left-1/2 top-[calc(100%+0.5rem)] z-30 -translate-x-1/2 whitespace-nowrap rounded-md border border-white/10 bg-neutral-950 px-3 py-2 text-xs font-normal text-neutral-200 opacity-0 shadow-xl shadow-black/30 transition group-hover:opacity-100 group-focus-visible:opacity-100">
                {m.description}
              </span>
            </Link>
          ))}
        </nav>

        {recommended ? (
          <div className="animate-enter-up mt-8 flex flex-col gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 sm:flex-row sm:items-center sm:justify-between [animation-delay:120ms]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-emerald-500/40 bg-emerald-500/15 text-emerald-300">
                <ArrowRight className="size-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300">
                  Continue your learning path - {recommended.track.title}
                </p>
                <p className="text-sm font-medium text-white">{recommended.pack.title}</p>
              </div>
            </div>
            <Link
              href={
                continueAttempt?.engagementIds.includes(recommended.pack.packId)
                  ? continueAttempt.href
                  : buildQuizHref({
                      mode: "academy",
                      count: recommended.pack.questionCount,
                      engagementIds: [recommended.pack.packId],
                      fresh: true,
                    })
              }
              className="shrink-0 rounded-lg border border-emerald-600/40 bg-emerald-600/10 px-5 py-2.5 text-center text-sm font-medium text-emerald-200 transition hover:bg-emerald-600/20 hover:text-emerald-100"
            >
              {continueAttempt?.engagementIds.includes(recommended.pack.packId)
                ? "Continue Last Attempt"
                : "Start"}
            </Link>
          </div>
        ) : (
          <div className="animate-enter-up mt-8 flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 [animation-delay:120ms]">
            <PartyPopper className="size-5 shrink-0 text-emerald-300" aria-hidden="true" />
            <p className="text-sm font-medium text-emerald-100">
              You&apos;ve completed every pack across all learning paths. Revisit any topic below to keep it sharp.
            </p>
          </div>
        )}

        <div className="animate-enter-up mt-10 border-t border-white/10 pt-6 [animation-delay:160ms]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-base font-medium text-white">Difficulty</span>
            <div className="flex flex-wrap gap-1.5">
              {(["all", ...packDifficulties] as PackDifficultyFilter[]).map(
                (difficulty) => {
                  const isSelected = difficultyFilter === difficulty;

                  return (
                    <button
                      key={difficulty}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => setDifficultyFilter(difficulty)}
                      className={`rounded-md border px-3 py-1.5 text-sm font-medium transition ${
                        isSelected
                          ? "border-blue-500/50 bg-blue-500/15 text-blue-100"
                          : "border-white/10 bg-neutral-950 text-neutral-400 hover:border-white/25 hover:bg-neutral-900 hover:text-neutral-100"
                      }`}
                    >
                      {difficulty === "all"
                        ? "All"
                        : packDifficultyLabels[difficulty]}
                    </button>
                  );
                },
              )}
            </div>
          </div>

          <div className="mt-4 grid gap-6">
            {academyTrackViews.map((track) => {
              const completedInTrack = track.packs.filter((p) =>
                passedPackIds.has(p.packId),
              ).length;
              const trackProgress =
                track.packs.length === 0
                  ? 0
                  : (completedInTrack / track.packs.length) * 100;
              const visiblePacks = track.packs.filter(
                (p) => difficultyFilter === "all" || p.difficulty === difficultyFilter,
              );

              if (visiblePacks.length === 0) {
                return null;
              }

              return (
                <section key={track.id}>
                  <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-semibold text-white">
                          {track.title}
                        </h2>
                        <span className="text-xs text-neutral-500">
                          {completedInTrack}/{track.packs.length} complete
                        </span>
                      </div>
                      <p className="mt-1 max-w-4xl text-sm leading-6 text-neutral-400">
                        {track.description}
                      </p>
                    </div>
                    <div className="w-full sm:w-48">
                      <Progress
                        value={trackProgress}
                        aria-label={`${track.title}: ${completedInTrack} of ${track.packs.length} packs complete`}
                        className="h-1.5 bg-neutral-800 [&_[data-slot=progress-indicator]]:bg-blue-500"
                      />
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {visiblePacks.map(renderAcademyPackButton)}
                  </div>
                </section>
              );
            })}
          </div>

        </div>
        <ReleaseNotice />
      </section>
    </main>
  );
}
