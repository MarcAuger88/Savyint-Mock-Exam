import type { SelectedAnswers } from "@/lib/answer-utils";
import type {
  Difficulty,
  ExamMode,
  ExamQuestion,
  QuestionType,
} from "@/types/question";

export type ExamDraft = {
  version: 1;
  sessionId: string | null;
  questions: ExamQuestion[];
  answers: SelectedAnswers;
  currentIndex: number;
  startedAt: number | null;
  updatedAt?: number;
};

export type ContinueAttempt = {
  href: string;
  engagementIds: string[];
  mode: ExamMode;
  updatedAt: number;
};

export type ExamDraftKeyOptions = {
  questionCount: number;
  timerEnabled: boolean;
  categories: string[];
  difficulties?: Difficulty[];
  engagementIds?: string[];
  mode?: ExamMode;
  types?: QuestionType[];
};

export const examDraftStoragePrefix = "saviynt-exam-draft:v1:";

export function createExamDraftStorageKey({
  questionCount,
  timerEnabled,
  categories,
  difficulties = [],
  engagementIds = [],
  mode = "trivia",
  types = [],
}: ExamDraftKeyOptions) {
  const categoriesKey =
    categories.length > 0 ? [...categories].sort().join("|") : "all";
  const difficultiesKey =
    difficulties.length > 0 ? [...difficulties].sort().join("|") : "all";
  const typesKey = types.length > 0 ? [...types].sort().join("|") : "all";
  const engagementIdsKey =
    engagementIds.length > 0 ? [...engagementIds].sort().join("|") : "all";

  return `${examDraftStoragePrefix}${questionCount}:${timerEnabled ? "timed" : "untimed"}:${categoriesKey}:${difficultiesKey}:${typesKey}:${mode}:${engagementIdsKey}`;
}

export function isExamDraft(value: unknown): value is ExamDraft {
  if (!value || typeof value !== "object") {
    return false;
  }

  const draft = value as Partial<ExamDraft>;

  return (
    draft.version === 1 &&
    Array.isArray(draft.questions) &&
    typeof draft.currentIndex === "number" &&
    (typeof draft.sessionId === "string" || draft.sessionId === null) &&
    (typeof draft.startedAt === "number" || draft.startedAt === null) &&
    Boolean(draft.answers && typeof draft.answers === "object")
  );
}

export function readExamDraft(storageKey: string) {
  const savedDraft = window.localStorage.getItem(storageKey);

  if (!savedDraft) {
    return null;
  }

  try {
    const parsedDraft = JSON.parse(savedDraft) as unknown;

    if (isExamDraft(parsedDraft) && parsedDraft.questions.length > 0) {
      return parsedDraft;
    }
  } catch {
    // Malformed drafts are cleared by the caller.
  }

  return null;
}

export function writeExamDraft(storageKey: string, draft: Omit<ExamDraft, "updatedAt">) {
  const nextDraft: ExamDraft = {
    ...draft,
    updatedAt: Date.now(),
  };

  window.localStorage.setItem(storageKey, JSON.stringify(nextDraft));
}

export function removeExamDraft(storageKey: string) {
  window.localStorage.removeItem(storageKey);
}

export function removeAllExamDrafts() {
  if (typeof window === "undefined") {
    return;
  }

  const keysToRemove: string[] = [];

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);

    if (key?.startsWith(examDraftStoragePrefix)) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => window.localStorage.removeItem(key));
}

export function removeExamDraftsForSession(sessionId: string) {
  if (typeof window === "undefined") {
    return;
  }

  const keysToRemove: string[] = [];

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);

    if (!key?.startsWith(examDraftStoragePrefix)) {
      continue;
    }

    const draft = readExamDraft(key);

    if (!draft || draft.sessionId === sessionId) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => window.localStorage.removeItem(key));
}

export function getLatestContinueAttempt(minQuestionCount: number, filterMode?: string): ContinueAttempt | null {
  if (typeof window === "undefined") {
    return null;
  }

  let latestAttempt: ContinueAttempt | null = null;
  const staleKeys: string[] = [];

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);

    if (!key?.startsWith(examDraftStoragePrefix)) {
      continue;
    }

    const draft = readExamDraft(key);

    if (!draft || !draft.sessionId) {
      staleKeys.push(key);
      continue;
    }

    const parts = key.split(":");
    const count = parts[2];
    const timer = parts[3];
    const categoriesKey = parts[4] ?? "all";
    const difficultiesKey = parts[5] ?? "all";
    const typesKey = parts[6] ?? "all";
    const modeKey = parts[7] ?? "trivia";
    const engagementIdsKey = parts[8] ?? "all";
    const questionCount = Number(count);

    const mode =
      modeKey === "engagement" || modeKey === "academy" ? modeKey : "trivia";

    if (filterMode && mode !== filterMode) {
      continue;
    }

    if (
      !Number.isFinite(questionCount) ||
      (mode === "trivia" && questionCount < minQuestionCount)
    ) {
      continue;
    }

    const params = new URLSearchParams();
    params.set("count", String(questionCount));
    params.set("timer", timer === "timed" ? "1" : "0");
    params.set("mode", mode);

    if (categoriesKey !== "all") {
      categoriesKey.split("|").forEach((category) => {
        if (category) {
          params.append("categories", category);
        }
      });
    }

    if (difficultiesKey !== "all") {
      difficultiesKey.split("|").forEach((difficulty) => {
        if (difficulty) {
          params.append("difficulties", difficulty);
        }
      });
    }

    if (typesKey !== "all") {
      typesKey.split("|").forEach((type) => {
        if (type) {
          params.append("types", type);
        }
      });
    }

    if (engagementIdsKey !== "all") {
      engagementIdsKey.split("|").forEach((engagementId) => {
        if (engagementId) {
          params.append("engagements", engagementId);
        }
      });
    }

    const updatedAt = draft.updatedAt ?? draft.startedAt ?? 0;

    if (!latestAttempt || updatedAt > latestAttempt.updatedAt) {
      latestAttempt = {
        href: `/quiz?${params.toString()}`,
        engagementIds:
          engagementIdsKey === "all"
            ? []
            : engagementIdsKey.split("|").filter(Boolean),
        mode,
        updatedAt,
      };
    }
  }

  staleKeys.forEach((key) => window.localStorage.removeItem(key));

  return latestAttempt;
}
