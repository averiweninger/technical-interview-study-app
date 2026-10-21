import type { MultipleChoiceQuestion } from "./types";

export type GradeResult =
  | { status: "invalid"; message: string; }
  | { status: "graded"; isCorrect: boolean; explanation: string; };

// Demonstration grading only. A future authenticated server use case must own real grades and private keys.
export function gradeAnswer(question: MultipleChoiceQuestion, optionId: string): GradeResult {
  if (!question.options.some((option) => option.id === optionId)) {
    return { status: "invalid", message: "Choose one of the listed answers." };
  }
  return { status: "graded", isCorrect: optionId === question.correctOptionId, explanation: question.explanation };
}
