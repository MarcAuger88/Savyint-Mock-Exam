import type { Customer, Difficulty, QuestionType } from "./question";

export type Engagement = {
  id: string;
  title: string;
  difficulty: Difficulty;
  customer: Customer;
  summary: string;
  introduction: string;
  estimatedDurationMinutes: number;
  recommendedScore: number;
  visuals?: {
    icon: string;
    cover?: string;
    alt: string;
  };
  recommendedExperience:
    | "Beginner"
    | "SCIP Candidate"
    | "Junior Consultant"
    | "Implementation Consultant";

  badges?: string[];
  phases: EngagementPhase[];
  initialMetrics: Partial<Record<EngagementMetric, number>>;

  conclusion?: {
    successMessage: string;
    failureMessage: string;
  };
};

export type EngagementSummary = {
  id: string;
  title: string;
  difficulty: Difficulty;
  introduction: string;
  summary: string;
  customer: {
    name: string;
    industry: string;
    employeeCount: number;
    authoritativeSources: string[];
    applications: string[];
    currentProblems: string[];
    goals: string[];
    riskProfile?: string;
  };
  phases: Array<{
    id: string;
    order: number;
    title: string;
    scenario?: string;
    learningObjectives: string[];
    questionCount: number;
  }>;
  visuals?: {
    icon: string;
    cover?: string;
    alt: string;
  };
  questionCount: number;
  isPlayable: boolean;
};

export type EngagementMetrics = {
  orphanAccounts: number;
  sodViolations: number;
  failedProvisioningTasks: number;
  auditRisk: number;
  customerSatisfaction: number;
  certificationCompletion: number;
  ownershipCoverage: number;
};

export type EngagementContext = {
  id: string;
  title: string;
  customer: Engagement["customer"];
  summary: string;
  day: {
    id: string;
    dayNumber: number;
    title: string;
    scenario: string;
    learningObjectives: string[];
  };
};

export type EngagementQuestion = {
  id: string;
  type: QuestionType;
  prompt: string;
  category: string;
  difficulty: Difficulty;

  choices?: string[];
  correctAnswers?: string[];

  elements?: string[];
  correctOrder?: string[];

  explanation: string;
};

export type EngagementEvent = {
  id: string;
  type:
    | "customerEmail"
    | "executiveMeeting"
    | "auditFinding"
    | "productionIncident"
    | "scopeChange"
    | "statusUpdate";
  title: string;
  message: string;
};

export type EngagementMetric =
  | "orphanAccounts"
  | "sodViolations"
  | "failedProvisioningTasks"
  | "auditRisk"
  | "customerSatisfaction"
  | "certificationCompletion"
  | "ownershipCoverage";

export type EngagementEffect = {
  metric: EngagementMetric;
  operation: "add" | "subtract" | "set";
  value: number;
  message: string;
};

export type EngagementPhase = {
  id: string;
  order: number;
  title: string;
  scenario: string;
  learningObjectives: string[];

  events?: EngagementEvent[];

  questions: EngagementQuestion[];

  successEffects?: EngagementEffect[];
  failureEffects?: EngagementEffect[];
};

export type CustomerChange = {
  metric: EngagementMetric;
  operation: "add" | "subtract" | "set";
  value: number;
  message: string;
};
