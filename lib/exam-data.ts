import { generateQuestionBank } from "@/lib/exam-generator";
import { analyzeQuestionBank } from "@/lib/question-validator";
import { difficultyPointValue, passingPercentage } from "@/lib/exam-constants";
import { examCategories } from "@/types/question";
import type { ExamCategory, ExamQuestion } from "@/types/question";

export { examCategories };
export type { ExamCategory, ExamQuestion };
export { difficultyPointValue, passingPercentage };

import examQuestionBank from "@/data/exam-question-bank.json";

export const examQuestions = generateQuestionBank(
  examQuestionBank as unknown as Parameters<typeof generateQuestionBank>[0],
);

export const questionBankAnalysis = analyzeQuestionBank(examQuestions);

if (questionBankAnalysis.errorCount > 0) {
  console.error("Question bank validation failed", questionBankAnalysis.issues);
}
