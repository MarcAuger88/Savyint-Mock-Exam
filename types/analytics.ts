export type PerformanceBucket = {
  label: string;
  totalQuestions: number;
  correct: number;
  earnedPoints: number;
  totalPoints: number;
  percentage: number;
};

export type RecentAttemptSummary = {
  id: string;
  completedAt: string;
  totalQuestions: number;
  earnedPoints: number;
  totalPoints: number;
  percentage: number;
  passed: boolean;
};

export type QuizAnalytics = {
  totalAttempts: number;
  totalQuestionsAnswered: number;
  averageScore: number;
  passRate: number;
  recentAttempts: RecentAttemptSummary[];
  byCategory: PerformanceBucket[];
  byDifficulty: PerformanceBucket[];
  byEngagement: PerformanceBucket[];
  weakCategories: PerformanceBucket[];
  weakDifficulties: PerformanceBucket[];
};
