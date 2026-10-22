import "server-only";
import type { MultipleChoiceQuestion } from "./types";

export type GradeResult =
  | { status: "invalid"; message: string; }
  | { status: "graded"; isCorrect: boolean; explanation: string; };

// Called only by authenticated server use cases. Scores describe practice, not mastery.
export function gradeAnswer(question: MultipleChoiceQuestion, optionId: string): GradeResult {
  if (!question.options.some((option) => option.id === optionId)) {
    return { status: "invalid", message: "Choose one of the listed answers." };
  }
  return { status: "graded", isCorrect: optionId === question.correctOptionId, explanation: question.explanation };
}
