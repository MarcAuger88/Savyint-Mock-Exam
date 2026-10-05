import type { ExamQuestion } from "@/types/question";

export type SelectedAnswers = Record<number, string[]>;
export type SubmittedAnswers = Record<number, string | string[]>;

export function getCorrectAnswers(question: Pick<ExamQuestion, "correctAnswers">) {
  return [...new Set(question.correctAnswers)];
}

export function normalizeSelectedAnswers(
  answers: SubmittedAnswers | SelectedAnswers,
): SelectedAnswers {
  return Object.fromEntries(
    Object.entries(answers).map(([questionId, answer]) => [
      questionId,
      Array.isArray(answer) ? answer : [answer],
    ]),
  ) as SelectedAnswers;
}

export function areAnswerSetsEqual(selectedAnswers: string[] | undefined, correctAnswers: string[]) {
  if (!selectedAnswers || selectedAnswers.length !== correctAnswers.length) {
    return false;
  }

  const selectedSet = new Set(selectedAnswers);

  return correctAnswers.every((answer) => selectedSet.has(answer));
}

export function areAnswerSequencesEqual(selectedAnswers: string[] | undefined, correctAnswers: string[]) {
  if (!selectedAnswers || selectedAnswers.length !== correctAnswers.length) {
    return false;
  }

  return correctAnswers.every((answer, index) => selectedAnswers[index] === answer);
}

export function isQuestionCorrect(
  question: Pick<ExamQuestion, "type" | "correctAnswers">,
  selectedAnswers: string[] | undefined,
) {
  const correctAnswers = getCorrectAnswers(question);

  if (
    question.type === "Order" ||
    question.type === "Match" ||
    question.type === "Timeline" ||
    question.type === "Workflow"
  ) {
    return areAnswerSequencesEqual(selectedAnswers, correctAnswers);
  }

  return areAnswerSetsEqual(selectedAnswers, correctAnswers);
}

export function formatAnswerList(answers: string[] | undefined) {
  if (!answers || answers.length === 0) {
    return "No answer";
  }

  return answers.join(", ");
}
