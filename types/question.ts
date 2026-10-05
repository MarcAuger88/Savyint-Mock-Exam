import type { EngagementContext } from "./engagement";
export type { EngagementContext } from "./engagement";

export type Difficulty = "easy" | "medium" | "hard" | "expert";
export type ExamMode = "trivia" | "engagement" | "academy";
export const examModes = [
  {
    label: "Trivia",
    value: "trivia",
    href: "/",
    icon: "Zap",
    description: "Customize a quiz tailored to what you want to practice.",
  },
  {
    label: "Academy",
    value: "academy",
    href: "/academy",
    icon: "GraduationCap",
    description: "Master one topic at a time.",
  },
  {
    label: "Consulting",
    value: "engagement",
    href: "/consulting",
    icon: "Briefcase",
    description: "Multi-phase real-life Enterprise scenarios.",
  },
] satisfies Array<{ value: ExamMode; label: string; href: string; icon: string; description: string }>;
export type QuestionType =
  | "Single"
  | "Multiple"
  | "Order"
  | "Match"
  | "Scenario"
  | "Timeline"
  | "Workflow"
  | "Consultant";

export const examCategories = [
  "Access Requests",
  "Access Request System",
  "Access Reviews",
  "Applications",
  "Certifications",
  "Controls",
  "Correlation",
  "Data Transformation",
  "Endpoints",
  "Entitlements",
  "Identity Governance",
  "Identity Repository",
  "SoD",
  "Workflows",
  "Approval Workflow",
  "Jobs",
  "Roles",
  "Ownership",
  "Recommendations",
  "Risk Management",
  "Rules",
  "Lifecycle Management",
  "Connectors",
  "Imports",
  "Provisioning",
  "Security Systems",
  "Analytics",
  "Reporting",
  "Identity Warehouse",
  "Troubleshooting",
] as const;

export type ExamCategory = (typeof examCategories)[number];

export type ExamQuestion = {
  id: number;
  type: QuestionType;
  prompt: string;
  statements?: string[];
  choices: string[];
  correctAnswers: string[];
  correctAnswerCount?: number;
  explanation: string;
  category: ExamCategory;
  difficulty: Difficulty;
  engagement?: EngagementContext;
  academy?: AcademyContext;
};

export type AcademyContext = {
  id: string;
  title: string;
  category: string;
};

export type Customer = {
  id: string;
  name: string;
  industry: string;
  employeeCount: number;
  authoritativeSources: string[];
  applications: string[];
  currentProblems: string[];
  goals?: string[];
  riskProfile?: "low" | "medium" | "high" | "critical";
};
