import { NextResponse } from "next/server";

import { getQuizAnalytics, resetQuizAnalytics } from "@/lib/quiz-attempt-store";
import type { ExamMode } from "@/types/question";

export const runtime = "nodejs";

function parseExamMode(request: Request): ExamMode {
  const mode = new URL(request.url).searchParams.get("mode");

  if (mode === "engagement" || mode === "academy") return mode;
  return "trivia";
}

export function GET(request: Request) {
  return NextResponse.json(getQuizAnalytics(parseExamMode(request)));
}

export function DELETE(request: Request) {
  return NextResponse.json(resetQuizAnalytics(parseExamMode(request)));
}
