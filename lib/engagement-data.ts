import rawEngagementBank from "@/data/engagement-bank.json";
import type {
  Difficulty,
  EngagementContext,
  ExamCategory,
  ExamQuestion,
  QuestionType,
} from "@/types/question";

const engagementQuestionIdOffset = 2_000_000;

const questionTypeByLowercase: Record<string, QuestionType> = {
  single: "Single",
  multiple: "Multiple",
  order: "Order",
  match: "Match",
  scenario: "Scenario",
  timeline: "Timeline",
  workflow: "Workflow",
  consultant: "Consultant",
};

const categoryAliases: Record<string, ExamCategory> = {
  Governance: "Identity Governance",
  "Technical Rules": "Rules",
  "User Update Rules": "Rules",
};

type FlexibleEngagementQuestion = {
  id: string;
  type: string;
  prompt: string;
  category: string;
  difficulty?: string;
  choices?: string[];
  elements?: string[];
  items?: string[];
  steps?: string[];
  correctAnswers?: string[];
  correctOrder?: string[];
  explanation?: string;
};

type FlexibleEngagementDay = {
  id: string;
  dayNumber: number;
  title: string;
  scenario?: string;
  learningObjectives?: string[];
  questions?: FlexibleEngagementQuestion[];
};

type FlexibleEngagementPhase = {
  id?: string;
  day?: number;
  dayNumber?: number;
  order?: number;
  title: string;
  scenario?: string;
  objectives?: string[];
  learningObjectives?: string[];
  questions?: FlexibleEngagementQuestion[];
};

type FlexibleEngagement = {
  id: string;
  title: string;
  difficulty?: Difficulty | "expert";
  summary?: string;
  introduction?: string;
  story?: string;
  visuals?: {
    icon: string;
    cover?: string;
    alt: string;
  };
  customer: {
    id?: string;
    name?: string;
    industry: string;
    employeeCount?: number;
    employees?: number;
    countries?: number;
    authoritativeSources?: string[];
    authoritativeSource?: string;
    applications: string[];
    currentProblems?: string[];
    goals?: string[];
    riskProfile?: "low" | "medium" | "high" | "critical";
  };
  days?: FlexibleEngagementDay[];
  phases?: FlexibleEngagementPhase[];
};

function normalizeEngagementBank(value: unknown): FlexibleEngagement[] {
  return Array.isArray(value)
    ? (value as FlexibleEngagement[])
    : [value as FlexibleEngagement];
}

function normalizeQuestionType(type: string): QuestionType {
  return questionTypeByLowercase[type.toLowerCase()] ?? "Single";
}

function normalizeCategory(category: string): ExamCategory {
  return categoryAliases[category] ?? (category as ExamCategory);
}

function normalizeDifficulty(difficulty: string | undefined): Difficulty {
  return difficulty === "easy" ||
    difficulty === "medium" ||
    difficulty === "hard" ||
    difficulty === "expert"
    ? difficulty
    : "hard";
}

export const engagements = normalizeEngagementBank(rawEngagementBank);

export const engagementQuestions: ExamQuestion[] = engagements.flatMap(
  (rawEngagement, engagementIndex) => {
    const engagement = rawEngagement as FlexibleEngagement;
    const days = engagement.days ?? [];
    const phases = engagement.phases ?? [];
    const engagementDays =
      days.length > 0
        ? days
        : phases.map((phase, phaseIndex) => ({
            id:
              phase.id ??
              `${engagement.id}-DAY-${String(phase.day ?? phaseIndex + 1).padStart(3, "0")}`,
            dayNumber: phase.dayNumber ?? phase.day ?? phaseIndex + 1,
            title: phase.title,
            scenario: phase.scenario ?? engagement.story ?? engagement.summary,
            learningObjectives:
              phase.learningObjectives ?? phase.objectives ?? [],
            questions: phase.questions ?? [],
          }));

    return engagementDays.flatMap((day, dayIndex) => {
      const context: EngagementContext = {
        id: engagement.id,
        title: engagement.title,
        customer: {
          ...engagement.customer,
          id: engagement.customer.id ?? engagement.id,
          name: engagement.customer.name ?? engagement.title,
          employeeCount:
            engagement.customer.employeeCount ??
            engagement.customer.employees ??
            0,
          authoritativeSources:
            engagement.customer.authoritativeSources ??
            (engagement.customer.authoritativeSource
              ? [engagement.customer.authoritativeSource]
              : []),
          currentProblems: engagement.customer.currentProblems ?? [],
        },
        summary: engagement.summary ?? engagement.story ?? "",
        day: {
          id: day.id,
          dayNumber: day.dayNumber,
          title: day.title,
          scenario:
            day.scenario ?? engagement.summary ?? engagement.story ?? "",
          learningObjectives: day.learningObjectives ?? [],
        },
      };

      return (day.questions ?? []).map((question, questionIndex) => {
        const raw = question as Record<string, unknown>;

        const prompt =
          (question.prompt as string | undefined) ??
          (raw.question as string | undefined) ??
          "";

        const choices: string[] =
          (question.choices as string[] | undefined) ??
          (raw.elements as string[] | undefined) ??
          (raw.steps as string[] | undefined) ??
          (raw.items as string[] | undefined) ??
          (raw.events as string[] | undefined) ??
          [];

        const rawCorrectAnswers =
          (question.correctAnswers as (string | number)[] | undefined) ??
          (raw.correctOrder as (string | number)[] | undefined) ??
          [];
        const singleCorrectAnswer = raw.correctAnswer as number | undefined;

        const correctAnswers: string[] =
          singleCorrectAnswer !== undefined
            ? [choices[singleCorrectAnswer]].filter(Boolean)
            : rawCorrectAnswers.every((a) => typeof a === "number")
              ? (rawCorrectAnswers as number[])
                  .map((i) => choices[i])
                  .filter(Boolean)
              : (rawCorrectAnswers as string[]);

        return {
          id:
            engagementQuestionIdOffset +
            engagementIndex * 10_000 +
            dayIndex * 100 +
            questionIndex +
            1,
          type: normalizeQuestionType(question.type),
          prompt,
          choices,
          correctAnswers,
          correctAnswerCount: correctAnswers.length,
          explanation: (question.explanation as string | undefined) ?? "",
          category: normalizeCategory(question.category),
          difficulty: normalizeDifficulty(question.difficulty),
          engagement: context,
        };
      });
    });
  },
);

const engagementIdsWithQuestions = new Set(
  engagementQuestions
    .map((question) => question.engagement?.id)
    .filter((id): id is string => Boolean(id)),
);

export const playableEngagements = engagements.filter((engagement) =>
  engagementIdsWithQuestions.has(engagement.id),
);

const engagementQuestionCounts = engagementQuestions.reduce<
  Record<string, number>
>((counts, question) => {
  const engagementId = question.engagement?.id;

  if (engagementId) {
    counts[engagementId] = (counts[engagementId] || 0) + 1;
  }

  return counts;
}, {});

export const engagementSummaries = engagements.map((engagement) => {
  const phases = engagement.phases ?? [];
  const days = engagement.days ?? [];
  const timelineItems = days.length > 0 ? days : phases;
  const customer = engagement.customer;
  const questionCount = engagementQuestionCounts[engagement.id] || 0;

  return {
    id: engagement.id,
    title: engagement.title,
    difficulty: normalizeDifficulty(engagement.difficulty),
    visuals: engagement.visuals,
    introduction: engagement.introduction ?? "",
    summary: engagement.summary ?? engagement.story ?? "",
    customer: {
      name: customer.name ?? engagement.title,
      industry: customer.industry,
      employeeCount: customer.employeeCount ?? customer.employees ?? 0,
      authoritativeSources:
        customer.authoritativeSources ??
        (customer.authoritativeSource ? [customer.authoritativeSource] : []),
      applications: customer.applications,
      currentProblems: customer.currentProblems ?? [],
      goals: customer.goals ?? [],
      riskProfile: customer.riskProfile,
    },
    phases: timelineItems.map((item, index) => {
      const phaseLike = item as FlexibleEngagementPhase;

      return {
        id:
          item.id ??
          `${engagement.id}-PHASE-${String(index + 1).padStart(3, "0")}`,
        order: item.dayNumber ?? phaseLike.day ?? phaseLike.order ?? index + 1,
        title: item.title,
        scenario: item.scenario,
        learningObjectives:
          item.learningObjectives ?? phaseLike.objectives ?? [],
        questionCount: item.questions?.length ?? 0,
      };
    }),
    questionCount,
    isPlayable: questionCount > 0,
  };
});
