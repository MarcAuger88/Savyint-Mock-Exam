import type { ExamQuestion } from "@/types/question";

export const passingPercentage = 70;

export const difficultyPointValue: Record<ExamQuestion["difficulty"], number> =
  {
    easy: 1,
    medium: 2,
    hard: 3,
    expert: 4,
  };

export const engagementTypePointValue: Record<ExamQuestion["type"], number> = {
  Single: 1,
  Multiple: 2,
  Scenario: 2,
  Order: 3,
  Timeline: 3,
  Workflow: 3,
  Match: 3,
  Consultant: 4,
};
