"use client";

import { Check, GripVertical, X } from "lucide-react";

import type { ExamQuestion } from "@/types/question";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type QuestionCardProps = {
  question: ExamQuestion;
  selectedAnswers?: string[];
  onAnswerChange: (answers: string[]) => void;
};

function splitPromptSentences(prompt: string) {
  return prompt
    .split(/(?<=[.?!])\s+(?=[A-Z("])/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function getSequenceInstruction(type: ExamQuestion["type"]) {
  if (type === "Timeline") {
    return "What happens next?";
  }

  if (type === "Workflow") {
    return "Administrator workflow";
  }

  return "Drag to order";
}

export function QuestionCard({
  question,
  selectedAnswers = [],
  onAnswerChange,
}: QuestionCardProps) {
  const allowsMultipleAnswers =
    question.type === "Multiple" ||
    question.type === "Scenario" ||
    question.type === "Consultant";
  const isSequenceQuestion =
    question.type === "Order" ||
    question.type === "Timeline" ||
    question.type === "Workflow";
  const isMatchQuestion = question.type === "Match";
  const orderedAnswers =
    isSequenceQuestion && selectedAnswers.length === 0
      ? question.choices
      : selectedAnswers;
  const matchStatements = question.statements ?? [];
  const matchedAnswers = Array.from(
    { length: matchStatements.length },
    (_, index) => selectedAnswers[index] ?? "",
  );
  const availableMatchAnswers = question.choices.filter(
    (choice) => !matchedAnswers.includes(choice),
  );

  function toggleAnswer(choice: string) {
    if (!allowsMultipleAnswers) {
      onAnswerChange([choice]);
      return;
    }

    onAnswerChange(
      selectedAnswers.includes(choice)
        ? selectedAnswers.filter((answer) => answer !== choice)
        : [...selectedAnswers, choice],
    );
  }

  function moveOrderedAnswer(fromIndex: number, toIndex: number) {
    const nextAnswers = [...orderedAnswers];
    const [movedAnswer] = nextAnswers.splice(fromIndex, 1);
    nextAnswers.splice(toIndex, 0, movedAnswer);
    onAnswerChange(nextAnswers);
  }

  function assignMatchAnswer(statementIndex: number, answer: string) {
    const nextAnswers = matchedAnswers.map((currentAnswer) =>
      currentAnswer === answer ? "" : currentAnswer,
    );
    nextAnswers[statementIndex] = answer;
    onAnswerChange(nextAnswers);
  }

  function clearMatchAnswer(statementIndex: number) {
    const nextAnswers = [...matchedAnswers];
    nextAnswers[statementIndex] = "";
    onAnswerChange(nextAnswers);
  }

  return (
    <Card
      data-testid="question-card"
      className="animate-enter-up overflow-hidden border border-white/10 bg-neutral-900/95 text-neutral-50 shadow-2xl shadow-black/40 ring-1 ring-blue-500/10"
    >
      <div className="h-1.5 bg-gradient-to-r from-blue-600 via-blue-400 to-cyan-500" />
      <CardHeader className="gap-4 px-7 pt-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className="h-auto border-cyan-300/40 bg-cyan-300/10 py-1 text-sm text-cyan-100"
          >
            {question.category}
          </Badge>
          {(allowsMultipleAnswers || isSequenceQuestion || isMatchQuestion) && (
            <Badge
              variant="outline"
              className="h-auto border-blue-500/40 bg-blue-500/10 py-1 text-sm text-blue-200"
            >
              {isSequenceQuestion
                ? getSequenceInstruction(question.type)
                : isMatchQuestion
                  ? "Drag to match"
                  : "Multiple answers"}
            </Badge>
          )}
        </div>
        {question.type === "Scenario" && question.statements && (
          <div className="grid gap-2 rounded-lg border border-white/10 bg-neutral-950/50 p-3 text-base text-neutral-300">
            {question.statements.map((statement) => (
              <p key={statement}>{statement}</p>
            ))}
          </div>
        )}
        <CardTitle
          className="text-base leading-6 font-normal tracking-tight text-white sm:text-lg sm:leading-7"
          style={{ fontFamily: "var(--font-geist-mono)" }}
        >
          {splitPromptSentences(question.prompt).map((sentence, index) => (
            <span key={index} className="block py-1.5 first:pt-0 last:pb-0">
              {sentence}
            </span>
          ))}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-7 pb-7 pt-1">
        {isSequenceQuestion ? (
          <div className="grid gap-3">
            {orderedAnswers.map((choice, index) => (
              <div
                key={choice}
                draggable
                onDragStart={(event) =>
                  event.dataTransfer.setData("text/plain", String(index))
                }
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  const fromIndex = Number(event.dataTransfer.getData("text/plain"));
                  if (!Number.isNaN(fromIndex)) {
                    moveOrderedAnswer(fromIndex, index);
                  }
                }}
                className="flex min-h-14 cursor-grab items-center gap-3 rounded-lg border border-white/10 bg-neutral-950/70 p-4 text-lg text-neutral-200 shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:border-blue-500/30 hover:bg-neutral-900 active:cursor-grabbing active:translate-y-0"
              >
                <GripVertical className="size-4 shrink-0 text-neutral-500" aria-hidden="true" />
                <span className="flex-1">{choice}</span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => moveOrderedAnswer(index, index - 1)}
                    className="rounded-md border border-white/10 px-2 py-1 text-sm text-neutral-300 transition hover:border-white/25 hover:bg-white/5 disabled:opacity-30"
                  >
                    Up
                  </button>
                  <button
                    type="button"
                    disabled={index === orderedAnswers.length - 1}
                    onClick={() => moveOrderedAnswer(index, index + 1)}
                    className="rounded-md border border-white/10 px-2 py-1 text-sm text-neutral-300 transition hover:border-white/25 hover:bg-white/5 disabled:opacity-30"
                  >
                    Down
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : isMatchQuestion ? (
          <div className="grid gap-4">
            <div
              className="flex min-h-12 flex-wrap gap-2 rounded-lg p-1"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const answer = event.dataTransfer.getData("text/plain");
                const sourceIndex = matchedAnswers.findIndex((a) => a === answer);
                if (sourceIndex >= 0) {
                  clearMatchAnswer(sourceIndex);
                }
              }}
            >
              {availableMatchAnswers.map((choice) => (
                <button
                  key={choice}
                  type="button"
                  data-testid="match-choice"
                  draggable
                  onDragStart={(event) =>
                    event.dataTransfer.setData("text/plain", choice)
                  }
                  onClick={() => {
                    const firstEmptyIndex = matchedAnswers.findIndex(
                      (answer) => answer === "",
                    );
                    if (firstEmptyIndex >= 0) {
                      assignMatchAnswer(firstEmptyIndex, choice);
                    }
                  }}
                  className="cursor-grab rounded-md border border-white/10 bg-neutral-950/70 px-3 py-2 text-lg text-neutral-200 shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:border-blue-500/30 hover:bg-neutral-900 active:cursor-grabbing active:translate-y-0"
                >
                  {choice}
                </button>
              ))}
            </div>
            <div className="grid gap-3">
              {matchStatements.map((statement, index) => (
                <div
                  key={statement}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    const answer = event.dataTransfer.getData("text/plain");
                    if (answer) {
                      assignMatchAnswer(index, answer);
                    }
                  }}
                  className="grid gap-2 rounded-lg border border-white/10 bg-neutral-950/60 p-4 transition hover:border-white/20 sm:grid-cols-[1fr_minmax(12rem,auto)] sm:items-center"
                >
                  <p className="min-w-0 text-lg font-semibold leading-7 text-neutral-200">{statement}</p>
                  <div
                    draggable={Boolean(matchedAnswers[index])}
                    onDragStart={(event) => {
                      if (matchedAnswers[index]) {
                        event.dataTransfer.setData("text/plain", matchedAnswers[index]);
                      }
                    }}
                    className={`flex min-h-14 items-center justify-between gap-2 whitespace-nowrap rounded-md border px-3 py-2 text-base transition ${
                      matchedAnswers[index]
                        ? "cursor-grab border-blue-500/40 bg-blue-500/10 text-blue-100 active:cursor-grabbing"
                        : "border-dashed border-white/15 bg-neutral-900/70 text-neutral-400"
                    }`}
                  >
                    <span className={matchedAnswers[index] ? "" : "text-lg"}>
                      {matchedAnswers[index] || "Drop answer here"}
                    </span>
                    {matchedAnswers[index] && (
                      <button
                        type="button"
                        onClick={() => clearMatchAnswer(index)}
                        className="text-neutral-500 hover:text-neutral-200"
                      >
                        <X className="size-4" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid gap-3">
          {question.choices.map((choice) => {
            const isSelected = selectedAnswers.includes(choice);

            return (
              <button
                key={choice}
                type="button"
                data-testid="answer-choice"
                aria-pressed={isSelected}
                onClick={() => toggleAnswer(choice)}
                className={`group flex h-auto min-h-14 w-full cursor-pointer items-center justify-start gap-3 rounded-lg border border-l-4 p-4 text-left text-lg leading-7 shadow-lg transition duration-200 hover:-translate-y-0.5 ${
                  isSelected
                    ? "border-blue-500 bg-blue-500/15 text-white shadow-blue-500/20 ring-1 ring-blue-400/20"
                    : "border-white/10 border-l-neutral-700 bg-neutral-950/70 text-neutral-300 shadow-black/10 hover:border-blue-500/30 hover:border-l-blue-500/60 hover:bg-neutral-900 hover:shadow-blue-950/20"
                }`}
              >
                {allowsMultipleAnswers && (
                  <span
                    className={`flex size-4 shrink-0 items-center justify-center rounded border ${
                      isSelected
                        ? "border-blue-300 bg-blue-400 text-neutral-950"
                        : "border-white/20"
                    }`}
                    aria-hidden="true"
                  >
                    {isSelected && <Check className="size-3" />}
                  </span>
                )}
                <span className="flex-1">{choice}</span>
                {isSelected && (
                  <span
                    className="size-2 shrink-0 rounded-full bg-blue-300 shadow-lg shadow-blue-500/40"
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
