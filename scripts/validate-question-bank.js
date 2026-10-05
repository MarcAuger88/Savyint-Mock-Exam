/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");

const filePath = path.resolve(__dirname, "../data/exam-question-bank.json");
const shouldFix = process.argv.includes("--fix");
let examQuestionBank = JSON.parse(fs.readFileSync(filePath, "utf8"));

const questionTypes = [
  "Single",
  "Multiple",
  "Order",
  "Match",
  "Scenario",
  "Timeline",
  "Workflow",
  "Consultant",
];
const questionTypeByLowercase = {
  single: "Single",
  multiple: "Multiple",
  order: "Order",
  match: "Match",
  scenario: "Scenario",
  timeline: "Timeline",
  workflow: "Workflow",
  consultant: "Consultant",
};
const difficultyAliases = {
  foundation: "easy",
  beginner: "easy",
  intermediate: "medium",
  advanced: "hard",
};
const validDifficulties = ["easy", "medium", "hard", "expert"];
const sequenceQuestionTypes = new Set(["Order", "Timeline", "Workflow"]);

function normalize(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function toText(item) {
  if (typeof item === "string") return item;
  if (item && typeof item === "object" && "text" in item) {
    return String(item.text ?? "");
  }
  return "";
}

function normalizeDifficulty(value) {
  const lower = String(value ?? "").toLowerCase();
  return difficultyAliases[lower] ?? lower;
}

function normalizeType(value) {
  return questionTypeByLowercase[String(value ?? "").toLowerCase()];
}

function applySafeFixes(items) {
  let fixCount = 0;
  const fixedItems = [];

  for (const item of items) {
    if (Array.isArray(item.questions) && !item.type) {
      for (const child of item.questions) {
        fixedItems.push({
          category: item.category,
          difficulty: item.difficulty,
          ...child,
        });
        fixCount += 1;
      }
      continue;
    }

    fixedItems.push(item);
  }

  for (const q of fixedItems) {
    const normalizedType = normalizeType(q.type);
    if (normalizedType && q.type !== normalizedType) {
      q.type = normalizedType;
      fixCount += 1;
    }

    const normalizedDifficulty = normalizeDifficulty(q.difficulty);
    if (normalizedDifficulty && q.difficulty !== normalizedDifficulty) {
      q.difficulty = normalizedDifficulty;
      fixCount += 1;
    }

    if (!q.prompt && q.question) {
      q.prompt = q.question;
      delete q.question;
      fixCount += 1;
    }

    if (
      q.type === "Match" &&
      Array.isArray(q.leftItems) &&
      Array.isArray(q.rightItems)
    ) {
      const statements = q.leftItems.map(toText).filter(Boolean);
      const choices = q.rightItems.map(toText).filter(Boolean);

      if (statements.length > 0 && choices.length > 0) {
        q.statements = statements;
        q.choices = choices;
        fixCount += 1;
      }

      if (Array.isArray(q.correctMatches)) {
        const rightById = new Map(q.rightItems.map((item) => [item.id, item.text]));
        const matchByLeftId = new Map(
          q.correctMatches.map((match) => [match.leftId, match.rightId]),
        );
        const correctAnswers = q.leftItems.map((leftItem) =>
          rightById.get(matchByLeftId.get(leftItem.id)) ?? "",
        );

        if (correctAnswers.every(Boolean)) {
          q.correctAnswers = correctAnswers;
          fixCount += 1;
        }
      } else if (
        q.correctAnswer &&
        !Array.isArray(q.correctAnswer) &&
        typeof q.correctAnswer === "object"
      ) {
        q.correctAnswers = statements.map((statement) => q.correctAnswer[statement] ?? "");
        fixCount += 1;
      }

      delete q.leftItems;
      delete q.rightItems;
      delete q.correctMatches;
      delete q.correctAnswer;
      continue;
    }

    if (!Array.isArray(q.choices)) {
      if (Array.isArray(q.items)) {
        q.choices = q.items.map(toText).filter(Boolean);
        delete q.items;
        fixCount += 1;
      } else if (Array.isArray(q.steps)) {
        q.choices = q.steps.map(toText).filter(Boolean);
        delete q.steps;
        fixCount += 1;
      } else if (Array.isArray(q.elements)) {
        q.choices = q.elements.map(toText).filter(Boolean);
        delete q.elements;
        fixCount += 1;
      }
    }

    if (!Array.isArray(q.correctAnswers)) {
      if (Array.isArray(q.correctOrder)) {
        q.correctAnswers = q.correctOrder;
        delete q.correctOrder;
        fixCount += 1;
      } else if (Array.isArray(q.correctAnswer)) {
        q.correctAnswers = q.correctAnswer;
        delete q.correctAnswer;
        fixCount += 1;
      } else if (typeof q.correctAnswer === "string") {
        q.correctAnswers = [q.correctAnswer];
        delete q.correctAnswer;
        fixCount += 1;
      }
    } else if (Object.hasOwn(q, "correctAnswer")) {
      delete q.correctAnswer;
      fixCount += 1;
    }
  }

  const dedupedItems = [];
  const seenExactQuestions = new Set();

  for (const q of fixedItems) {
    const exactKey = JSON.stringify({
      type: q.type,
      prompt: normalize(q.prompt || ""),
      category: q.category,
      difficulty: q.difficulty,
      choices: q.choices,
      statements: q.statements,
      correctAnswers: q.correctAnswers,
    });

    if (seenExactQuestions.has(exactKey)) {
      fixCount += 1;
      continue;
    }

    seenExactQuestions.add(exactKey);
    dedupedItems.push(q);
  }

  return { fixedItems: dedupedItems, fixCount };
}

function validateQuestions(items) {
  const issues = [];
  const seenPrompts = new Map();

  for (let index = 0; index < items.length; index += 1) {
    const q = items[index];
    const normalizedPrompt = normalize(q.prompt || "");
    const questionType = normalizeType(q.type);
    const choices = Array.isArray(q.choices)
      ? q.choices
      : Array.isArray(q.items)
        ? q.items
        : Array.isArray(q.steps)
          ? q.steps
          : [];
    const correctAnswers = Array.isArray(q.correctAnswers)
      ? q.correctAnswers
      : Array.isArray(q.correctOrder)
        ? q.correctOrder
        : [];

    if (!q.prompt || !String(q.prompt).trim()) {
      issues.push({ index, severity: "error", message: "Missing prompt." });
    }

    if (Object.hasOwn(q, "correctAnswer")) {
      issues.push({
        index,
        severity: "error",
        message: "Use correctAnswers instead of correctAnswer.",
      });
    }

    if (!questionType || !questionTypes.includes(questionType)) {
      issues.push({ index, severity: "error", message: "Invalid question type." });
    }

    if (seenPrompts.has(normalizedPrompt)) {
      issues.push({
        index,
        severity: "error",
        message: `Duplicate prompt. First seen at index ${seenPrompts.get(normalizedPrompt)}.`,
      });
    } else {
      seenPrompts.set(normalizedPrompt, index);
    }

    const maxChoices = questionType === "Single" ? 4 : 8;

    if (choices.length < 2 || choices.length > maxChoices) {
      issues.push({
        index,
        severity: "error",
        message: `Question must have between 2 and ${maxChoices} choices.`,
      });
    } else {
      const normalizedChoices = choices.map(normalize);
      const uniqueChoices = new Set(normalizedChoices);

      if (uniqueChoices.size !== choices.length) {
        issues.push({ index, severity: "error", message: "Choices must be unique." });
      }

      if (correctAnswers.length === 0) {
        issues.push({
          index,
          severity: "error",
          message: "Question must include at least one correctAnswers value.",
        });
      }

      for (const answer of correctAnswers) {
        if (!choices.includes(answer)) {
          issues.push({
            index,
            severity: "error",
            message: "Each correct answer must exactly match one of the choices.",
          });
        }
      }

      if (new Set(correctAnswers).size !== correctAnswers.length) {
        issues.push({
          index,
          severity: "error",
          message: "correctAnswers must be unique.",
        });
      }

      if (questionType === "Single" && correctAnswers.length !== 1) {
        issues.push({
          index,
          severity: "error",
          message: "Single questions must include exactly one correct answer.",
        });
      }

      if (sequenceQuestionTypes.has(questionType)) {
        const choicesSet = new Set(choices);
        if (
          correctAnswers.length !== choices.length ||
          !correctAnswers.every((answer) => choicesSet.has(answer))
        ) {
          issues.push({
            index,
            severity: "error",
            message: `${questionType} questions must include every choice in correctAnswers in the correct sequence.`,
          });
        }
      }

      if (questionType === "Match") {
        if (!Array.isArray(q.statements) || q.statements.length < 2) {
          issues.push({
            index,
            severity: "error",
            message: "Match questions must include at least two statements.",
          });
        } else if (q.statements.length !== correctAnswers.length) {
          issues.push({
            index,
            severity: "error",
            message: "Match questions must have one correct answer per statement.",
          });
        }
      }

      if (
        questionType === "Scenario" &&
        (!Array.isArray(q.statements) || q.statements.length < 2)
      ) {
        issues.push({
          index,
          severity: "error",
          message: "Scenario questions must include at least two statements.",
        });
      }
    }

    if (!q.explanation || !String(q.explanation).trim()) {
      issues.push({ index, severity: "warning", message: "Missing explanation." });
    }

    if (!q.category || !String(q.category).trim()) {
      issues.push({ index, severity: "warning", message: "Missing category." });
    }

    if (!validDifficulties.includes(q.difficulty)) {
      issues.push({ index, severity: "error", message: "Invalid difficulty." });
    }
  }

  return issues;
}

if (shouldFix) {
  const { fixedItems, fixCount } = applySafeFixes(examQuestionBank);
  examQuestionBank = fixedItems;
  fs.writeFileSync(filePath, `${JSON.stringify(examQuestionBank, null, 2)}\n`);
  console.log(`Applied ${fixCount} safe question-bank fix(es).`);
}

const issues = validateQuestions(examQuestionBank);
const errorCount = issues.filter((issue) => issue.severity === "error").length;
const warningCount = issues.filter((issue) => issue.severity === "warning").length;

console.log(`Exam question bank validation complete. ${errorCount} error(s), ${warningCount} warning(s).`);

if (issues.length > 0) {
  for (const issue of issues) {
    console.log(`${issue.severity.toUpperCase()}: [${issue.index}] ${issue.message}`);
  }
}

if (errorCount > 0) {
  process.exit(1);
}
