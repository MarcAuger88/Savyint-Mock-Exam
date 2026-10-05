"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ListChecks } from "lucide-react";

import { ExamProgress } from "@/components/ExamProgress";
import { QuestionCard } from "@/components/QuestionCard";
import { ResultsSummary } from "@/components/ResultsSummary";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/LoadingSpinner";
import type { SelectedAnswers } from "@/lib/answer-utils";
import {
  createExamDraftStorageKey,
  readExamDraft,
  removeExamDraft,
  removeExamDraftsForSession,
  writeExamDraft,
} from "@/lib/quiz-draft-store";
import { quizTheme } from "@/lib/theme-tokens";
import {
  examModes,
  type Difficulty,
  type ExamMode,
  type ExamQuestion,
  type QuestionType,
} from "@/types/question";

const minQuestionCount = 10;

type QuizClientProps = {
  mode: ExamMode;
  questionCount: number;
  requestedCategories: string[];
  requestedDifficulties: Difficulty[];
  requestedEngagementIds: string[];
  requestedTypes: QuestionType[];
  freshStart: boolean;
};

function isQuestionAnswered(
  question: ExamQuestion,
  questionAnswers: string[] | undefined,
) {
  if (question.type === "Match") {
    return Boolean(
      question.statements?.length &&
        questionAnswers?.length === question.statements.length &&
        questionAnswers.every(Boolean),
    );
  }

  return Boolean(questionAnswers?.length);
}

function isSequenceQuestion(question: ExamQuestion) {
  return (
    question.type === "Order" ||
    question.type === "Timeline" ||
    question.type === "Workflow"
  );
}

// NOTE: questions are generated and filtered server-side; client does not need
// local category filtering or shuffling. Keep client lightweight.

export function QuizClient({
  mode,
  questionCount,
  requestedCategories,
  requestedDifficulties,
  requestedEngagementIds,
  requestedTypes,
  freshStart,
}: QuizClientProps) {
  const minimumItemCount = mode === "trivia" ? minQuestionCount : 1;
  const boundedQuestionCount = Math.max(questionCount, minimumItemCount);
  const examStorageKey = useMemo(() => {
    return createExamDraftStorageKey({
      questionCount: boundedQuestionCount,
      timerEnabled: false,
      categories: requestedCategories,
      difficulties: requestedDifficulties,
      engagementIds: requestedEngagementIds,
      mode,
      types: requestedTypes,
    });
  }, [
    boundedQuestionCount,
    mode,
    requestedCategories,
    requestedDifficulties,
    requestedEngagementIds,
    requestedTypes,
  ]);
  const [activeQuestions, setActiveQuestions] = useState<ExamQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [grading, setGrading] = useState(false);
  const [gradingError, setGradingError] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<SelectedAnswers>({});
  const [confirmedQuestionIds, setConfirmedQuestionIds] = useState<Set<number>>(new Set());
  const [isComplete, setIsComplete] = useState(false);
  const finishingRef = useRef(false);
  const previousEngagementPhaseIdRef = useRef<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadExam() {
      setLoading(true);
      try {
        if (freshStart) {
          removeExamDraft(examStorageKey);

          const currentUrl = new URL(window.location.href);
          currentUrl.searchParams.delete("fresh");
          window.history.replaceState(null, "", currentUrl.toString());
        }

        const savedDraft = freshStart ? null : readExamDraft(examStorageKey);

        if (savedDraft && savedDraft.sessionId) {
          setSessionId(savedDraft.sessionId);
          setActiveQuestions(savedDraft.questions);
          setAnswers(savedDraft.answers);
          setConfirmedQuestionIds(
            new Set(
              Object.entries(savedDraft.answers)
                .filter(([, ans]) => Array.isArray(ans) ? ans.length > 0 : Boolean(ans))
                .map(([id]) => Number(id)),
            ),
          );
          setCurrentIndex(
            Math.min(
              Math.max(savedDraft.currentIndex, 0),
              savedDraft.questions.length - 1,
            ),
          );
          setStartedAt(savedDraft.startedAt);
          setElapsedSeconds(
            savedDraft.startedAt
              ? Math.max(
                  0,
                  Math.floor((Date.now() - savedDraft.startedAt) / 1000),
                )
              : 0,
          );
          return;
        }

        if (savedDraft) {
          removeExamDraft(examStorageKey);
        }

        const params = new URLSearchParams();
        params.set("count", String(boundedQuestionCount));
        params.set("mode", mode);
        for (const c of requestedCategories) {
          params.append("categories", c);
        }
        for (const difficulty of requestedDifficulties) {
          params.append("difficulties", difficulty);
        }
        for (const engagementId of requestedEngagementIds) {
          params.append("engagements", engagementId);
        }
        for (const type of requestedTypes) {
          params.append("types", type);
        }

        const res = await fetch(`/api/quiz?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!res.ok) return;
        const json = await res.json();
        const questions = json.questions || [];
        setSessionId(json.sessionId || null);
        setActiveQuestions(questions);
        setStartedAt(questions.length > 0 ? Date.now() : null);
        setElapsedSeconds(0);
      } catch (err) {
        const e = err as { name?: string };
        if (e.name === "AbortError") return;
      } finally {
        setLoading(false);
      }
    }

    loadExam();

    return () => controller.abort();
  }, [
    boundedQuestionCount,
    examStorageKey,
    freshStart,
    mode,
    requestedCategories,
    requestedDifficulties,
    requestedEngagementIds,
    requestedTypes,
  ]);

  const currentQuestion = activeQuestions[currentIndex];
  const currentEngagement = currentQuestion?.engagement;
  const currentEngagementPhaseId = currentEngagement
    ? `${currentEngagement.id}:${currentEngagement.day.id}`
    : null;
  const selectedAnswers = currentQuestion
    ? (answers[currentQuestion.id] ?? [])
    : [];
  const isCurrentQuestionAnswered =
    currentQuestion && isSequenceQuestion(currentQuestion)
      ? currentQuestion.choices.length > 0
      : currentQuestion
        ? isQuestionAnswered(currentQuestion, answers[currentQuestion.id])
        : false;
  const isLastQuestion = currentQuestion
    ? currentIndex === activeQuestions.length - 1
    : false;
  const exitHref =
    examModes.find((m) => m.value === mode)?.href ?? "/";
  const answeredCount = activeQuestions.filter((question) =>
    confirmedQuestionIds.has(question.id),
  ).length;
  const engagementPhaseQuestions = currentEngagement
    ? activeQuestions.filter(
        (question) =>
          question.engagement?.id === currentEngagement.id &&
          question.engagement.day.id === currentEngagement.day.id,
      )
    : [];
  const engagementPhaseAnsweredCount = engagementPhaseQuestions.filter(
    (question) => confirmedQuestionIds.has(question.id),
  ).length;
  const renderExamStatusCard = (isSideRail = false) => {
    const progressCompleted = currentEngagement
      ? engagementPhaseAnsweredCount
      : answeredCount;
    const progressTotal = currentEngagement
      ? engagementPhaseQuestions.length
      : activeQuestions.length;
    const progressLabel = currentEngagement
      ? `${progressCompleted} of ${progressTotal} answered`
      : `Answered ${progressCompleted} of ${progressTotal}`;
    const progressScopeLabel = currentEngagement
      ? `Phase ${currentEngagement.day.dayNumber} Progress`
      : null;

    return (
      <div className="overflow-hidden rounded-xl border border-white/10 bg-neutral-950/90 shadow-2xl shadow-black/30 backdrop-blur">
        <div
          className={`flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between ${
            isSideRail ? "lg:flex-col lg:items-start" : ""
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`flex size-10 items-center justify-center rounded-lg border ${quizTheme.primaryIconSoft}`}
            >
              <ListChecks className="size-5" aria-hidden="true" />
            </div>
            <div>
              {progressScopeLabel && (
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-300">
                  {progressScopeLabel}
                </p>
              )}
              <p className="text-base font-medium text-white">
                {progressLabel}
              </p>
            </div>
          </div>
        </div>
        <ExamProgress
          completedQuestions={progressCompleted}
          totalQuestions={progressTotal}
        />
      </div>
    );
  };

  useEffect(() => {
    if (loading || isComplete) {
      return;
    }

    if (!currentEngagementPhaseId) {
      previousEngagementPhaseIdRef.current = null;
      return;
    }

    if (previousEngagementPhaseIdRef.current === null) {
      previousEngagementPhaseIdRef.current = currentEngagementPhaseId;
      return;
    }

    if (previousEngagementPhaseIdRef.current !== currentEngagementPhaseId) {
      previousEngagementPhaseIdRef.current = currentEngagementPhaseId;
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentEngagementPhaseId, isComplete, loading]);

  useEffect(() => {
    if (loading || isComplete || activeQuestions.length === 0 || !sessionId) {
      return;
    }

    writeExamDraft(examStorageKey, {
      version: 1,
      sessionId,
      questions: activeQuestions,
      answers,
      currentIndex,
      startedAt,
    });
  }, [
    activeQuestions,
    answers,
    currentIndex,
    examStorageKey,
    isComplete,
    loading,
    sessionId,
    startedAt,
  ]);

  useEffect(() => {
    if (!startedAt || isComplete || loading) return;

    const startTime = startedAt;

    function updateElapsedTime() {
      setElapsedSeconds(
        Math.max(0, Math.floor((Date.now() - startTime) / 1000)),
      );
    }

    updateElapsedTime();
    const interval = window.setInterval(updateElapsedTime, 1000);

    return () => window.clearInterval(interval);
  }, [isComplete, loading, startedAt]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (loading || grading || isComplete || !currentQuestion) return;
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
        return;
      }

      const target = event.target as HTMLElement | null;
      const isTypingTarget =
        target?.isContentEditable ||
        target?.tagName === "INPUT" ||
        target?.tagName === "SELECT" ||
        target?.tagName === "TEXTAREA";
      if (isTypingTarget) return;

      const choiceIndex = Number(event.key) - 1;
      const choice = currentQuestion.choices[choiceIndex];
      if (
        !choice ||
        choiceIndex < 0 ||
        choiceIndex > 3 ||
        isSequenceQuestion(currentQuestion) ||
        currentQuestion.type === "Match"
      ) {
        return;
      }

      event.preventDefault();
      setAnswers((currentAnswers) => ({
        ...currentAnswers,
        [currentQuestion.id]:
          currentQuestion.type === "Multiple" ||
          currentQuestion.type === "Scenario" ||
          currentQuestion.type === "Consultant"
            ? currentAnswers[currentQuestion.id]?.includes(choice)
              ? currentAnswers[currentQuestion.id].filter(
                  (answer) => answer !== choice,
                )
              : [...(currentAnswers[currentQuestion.id] ?? []), choice]
            : [choice],
      }));
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentQuestion, grading, isComplete, loading]);

  const finishExam = useCallback(
    async (answersOverride?: SelectedAnswers) => {
      if (finishingRef.current || isComplete) return;
      finishingRef.current = true;
      const answersToSubmit = answersOverride ?? answers;

      const durationSeconds = startedAt
        ? Math.max(elapsedSeconds, Math.floor((Date.now() - startedAt) / 1000))
        : elapsedSeconds;

      if (!sessionId) {
        setGradingError(
          "This attempt cannot be graded because its saved session is missing. Please start a new exam.",
        );
        setIsComplete(true);
        removeExamDraft(examStorageKey);
        return;
      }

      setGrading(true);
      try {
        const res = await fetch(`/api/quiz`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            sessionId,
            answers: answersToSubmit,
            durationSeconds,
          }),
        });
        if (!res.ok) {
          setGradingError("Server error while grading. Please try again.");
          setIsComplete(true);
          return;
        }
        const json = await res.json();
        const gradedQuestions: ExamQuestion[] = json.gradedQuestions || [];
        const engagementById = new Map(
          activeQuestions
            .filter((q) => q.engagement)
            .map((q) => [q.id, q.engagement]),
        );
        const academyById = new Map(
          activeQuestions
            .filter((q) => q.academy)
            .map((q) => [q.id, q.academy]),
        );
        setActiveQuestions(
          gradedQuestions.map((q) => ({
            ...q,
            engagement: engagementById.get(q.id) ?? q.engagement,
            academy: academyById.get(q.id) ?? q.academy,
          })),
        );
        setIsComplete(true);
        removeExamDraftsForSession(sessionId);
      } catch {
        setGradingError("Network error while grading. Please try again.");
        setIsComplete(true);
      } finally {
        setGrading(false);
      }
    },
    [
      activeQuestions,
      answers,
      elapsedSeconds,
      examStorageKey,
      isComplete,
      sessionId,
      startedAt,
    ],
  );


  function handleAnswerChange(questionAnswers: string[]) {
    if (!currentQuestion) return;

    setAnswers((currentAnswers) => ({
      ...currentAnswers,
      [currentQuestion.id]: questionAnswers,
    }));
  }

  function handleNext() {
    if (currentQuestion) {
      setConfirmedQuestionIds((prev) => {
        if (prev.has(currentQuestion.id)) return prev;
        const next = new Set(prev);
        next.add(currentQuestion.id);
        return next;
      });
    }

    const nextAnswers =
      currentQuestion &&
      !answers[currentQuestion.id] &&
      isSequenceQuestion(currentQuestion)
        ? {
            ...answers,
            [currentQuestion.id]: currentQuestion.choices,
          }
        : answers;

    if (nextAnswers !== answers) {
      setAnswers(nextAnswers);
    }

    if (isLastQuestion) {
      const unansweredCount = activeQuestions.filter(
        (question) => !isQuestionAnswered(question, nextAnswers[question.id]),
      ).length;

      if (unansweredCount > 0) {
        const confirmed = window.confirm(
          `You still have ${unansweredCount} unanswered question${
            unansweredCount === 1 ? "" : "s"
          }. Finish exam anyway?`,
        );

        if (!confirmed) {
          return;
        }
      }

      void finishExam(nextAnswers);
      return;
    }

    setCurrentIndex((index) => index + 1);
  }

  function handleRetake() {
    // trigger reload by updating state that the effect depends on
    removeExamDraft(examStorageKey);
    setActiveQuestions([]);
    setAnswers({});
    setConfirmedQuestionIds(new Set());
    setCurrentIndex(0);
    setIsComplete(false);
    setSessionId(null);
    setStartedAt(null);
    setElapsedSeconds(0);
    finishingRef.current = false;
    // re-run effect by setting a micro timeout to refetch
    setTimeout(() => {
      const params = new URLSearchParams();
      params.set("count", String(boundedQuestionCount));
      params.set("mode", mode);
      for (const c of requestedCategories) params.append("categories", c);
      for (const difficulty of requestedDifficulties) {
        params.append("difficulties", difficulty);
      }
      for (const engagementId of requestedEngagementIds) {
        params.append("engagements", engagementId);
      }
      for (const type of requestedTypes) params.append("types", type);
      fetch(`/api/quiz?${params.toString()}`)
        .then((r) => r.json())
        .then((json) => {
          const questions = json.questions || [];
          setSessionId(json.sessionId || null);
          setActiveQuestions(questions);
          setStartedAt(questions.length > 0 ? Date.now() : null);
          setElapsedSeconds(0);
        })
        .catch(() => {});
    }, 50);
  }

  return (
    <main
      className="relative min-h-screen bg-neutral-950 px-4 py-6 text-neutral-50 sm:px-6 lg:px-8"
      style={{
        backgroundImage:
          "radial-gradient(ellipse 100% 45% at 50% 0%, rgb(59 130 246 / 0.16), transparent), radial-gradient(ellipse 80% 45% at 90% 100%, rgb(16 185 129 / 0.12), transparent)",
      }}
    >
      {loading && (
        <div
          className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 text-center"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="rounded-3xl border border-white/10 bg-neutral-950/95 p-10 shadow-2xl shadow-black/50">
            <LoadingSpinner message="Preparing your exam..." />
          </div>
        </div>
      )}
      <div className="mx-auto max-w-[92rem]">
        <header className="mb-8">
          <div className="sr-only" aria-live="polite">
            {loading
              ? "Preparing your exam."
              : grading
                ? "Grading your answers."
                : ""}
          </div>
          {(loading || grading) && (
            <LoadingSpinner
              message={grading ? "Grading..." : "Loading exam..."}
            />
          )}
        </header>

        {isComplete ? (
          gradingError ? (
            <div className="rounded-lg border border-red-600 bg-neutral-900/60 p-6 text-base text-red-300">
              <p className="mb-4">{gradingError}</p>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setGradingError(null);
                    handleRetake();
                  }}
                >
                  Retake
                </Button>
              </div>
            </div>
          ) : (
            <ResultsSummary
              questions={activeQuestions}
              answers={answers}
              elapsedSeconds={undefined}
              mode={mode}
              onRetake={handleRetake}
            />
          )
        ) : loading ? (
          <div className="rounded-lg border border-white/10 bg-neutral-900/60 p-6 text-base text-neutral-300">
            <p>Preparing your exam...</p>
          </div>
        ) : activeQuestions.length === 0 ? (
          <div className="rounded-lg border border-white/10 bg-neutral-900/60 p-6 text-base text-neutral-300">
            <p>
              No questions were available for the selected categories and count.
            </p>
            <div className="mt-4 flex gap-2">
              <Button onClick={handleRetake}>Try again</Button>
            </div>
          </div>
        ) : (
          <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
            <div className="min-w-0 space-y-5">
              {currentEngagement && (
                <section
                  key={currentEngagementPhaseId}
                  className="engagement-phase-summary rounded-xl border border-blue-500/20 bg-neutral-900/80 p-6 shadow-2xl shadow-black/20 sm:p-7"
                >
                  <p className="text-sm font-semibold uppercase tracking-wide text-neutral-400">
                    Day {currentEngagement.day.dayNumber}
                  </p>
                  <h2 className="mt-1 text-3xl font-semibold text-blue-300">
                    {currentEngagement.day.title}
                  </h2>
                  <p className="mt-4 text-lg leading-8 text-neutral-300">
                    {currentEngagement.day.scenario}
                  </p>
                  {currentEngagement.day.learningObjectives.length > 0 && (
                    <div className="mt-5">
                      <p className="text-base font-medium uppercase tracking-wide text-neutral-400">
                        Objectives
                      </p>
                      <ul className="mt-3 grid gap-2.5 text-lg text-blue-200/80 sm:grid-cols-2">
                        {currentEngagement.day.learningObjectives.map(
                          (objective) => (
                            <li key={objective} className="flex gap-2">
                              <span className="mt-3 size-2 shrink-0 rounded-full bg-blue-300" />
                              <span>{objective}</span>
                            </li>
                          ),
                        )}
                      </ul>
                    </div>
                  )}
                </section>
              )}

              {!currentEngagement && (
                <div className="sticky top-4 z-20">
                  {renderExamStatusCard()}
                </div>
              )}

              {currentEngagement && renderExamStatusCard()}

              <QuestionCard
                key={currentQuestion.id}
                question={currentQuestion}
                selectedAnswers={selectedAnswers}
                onAnswerChange={handleAnswerChange}
              />
              <div className="flex items-center justify-between">
                <Button asChild size="lg" variant="outline" className="h-13 px-7 text-lg border-red-600/40 bg-red-600/10 text-red-200 hover:bg-red-600/20 hover:text-red-100">
                  <Link href={exitHref}>
                    <ArrowLeft className="size-4" aria-hidden="true" />
                    Exit
                  </Link>
                </Button>
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  onClick={handleNext}
                  data-testid="next-question"
                  disabled={
                    (!isLastQuestion && !isCurrentQuestionAnswered) ||
                    loading ||
                    grading
                  }
                  className={`h-13 px-7 text-lg ${quizTheme.primaryAction}`}
                >
                  {isLastQuestion ? "Finish Exam" : "Next"}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </div>

            <aside className="space-y-4 lg:sticky lg:top-4">
              {currentEngagement && (
                <section className="rounded-xl border border-blue-500/20 bg-neutral-900/80 p-4 shadow-2xl shadow-black/20">
                  <p className="text-sm font-semibold uppercase tracking-wide text-blue-300">
                    Consulting Engagement
                  </p>
                  <h2 className="mt-1 text-base font-semibold text-white">
                    {currentEngagement.title.includes(" - ")
                      ? currentEngagement.title.split(" - ").slice(1).join(" - ")
                      : currentEngagement.title}
                  </h2>
                  <div className="mt-3 grid gap-2 text-base text-neutral-300">
                    <p>
                      <span className="font-medium text-neutral-400">
                        Customer:
                      </span>{" "}
                      {currentEngagement.customer.name}
                    </p>
                    <p>
                      <span className="font-medium text-neutral-400">
                        Industry:
                      </span>{" "}
                      {currentEngagement.customer.industry}
                    </p>
                    <p>
                      <span className="font-medium text-neutral-400">
                        Employees:
                      </span>{" "}
                      {currentEngagement.customer.employeeCount.toLocaleString()}
                    </p>
                  </div>
                  <p className="mt-3 text-lg leading-8 text-neutral-300">
                    {currentEngagement.summary}
                  </p>
                </section>
              )}

              {!currentEngagement && (
                <section className="rounded-xl border border-white/10 bg-neutral-900/70 p-4 shadow-2xl shadow-black/20">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-base font-medium text-white">
                        Question Navigator
                      </h2>
                      <p className="mt-1 text-sm text-neutral-500">
                        Jump between questions
                      </p>
                    </div>
                  </div>
                  <div className="grid max-h-[min(34rem,65vh)] grid-cols-5 gap-2 overflow-y-auto pr-1">
                    {activeQuestions.map((question, index) => {
                      const isAnswered = confirmedQuestionIds.has(question.id);
                      const isCurrent = index === currentIndex;

                      return (
                        <button
                          key={question.id}
                          type="button"
                          onClick={() => setCurrentIndex(index)}
                          aria-current={isCurrent ? "step" : undefined}
                          className={`flex aspect-square items-center justify-center rounded-lg border text-base font-medium transition ${
                            isCurrent
                              ? "border-blue-400 bg-blue-500/20 text-blue-100 shadow-lg shadow-blue-950/30 ring-1 ring-blue-400/30"
                              : isAnswered
                                ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-200 hover:border-emerald-300/50 hover:bg-emerald-500/25"
                                : "border-white/10 bg-neutral-950/70 text-neutral-400 hover:border-white/25 hover:bg-neutral-900 hover:text-neutral-200"
                          }`}
                        >
                          {index + 1}
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}

            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
