import type { Difficulty } from "../curriculum/types";

interface QuestionBase {
  id: string;
  topicId: string;
  difficulty: Difficulty;
  prompt: string;
  explanation: string;
}

// The kind discriminant lets TypeScript require choices only for multiple-choice questions.
export interface MultipleChoiceQuestion extends QuestionBase {
  kind: "multiple-choice";
  options: { id: string; text: string; }[];
  correctOptionId: string;
}

export interface ShortAnswerQuestion extends QuestionBase {
  kind: "short-answer";
  modelAnswer: string;
}

export interface CodingQuestion extends QuestionBase {
  kind: "coding";
  language: "Python" | "SQL";
  example: string;
  solution: string;
}

export type PracticeQuestion = MultipleChoiceQuestion | ShortAnswerQuestion | CodingQuestion;

// Explicit public shapes: never serialize the full server question bank into a Client Component.
type PublicBase = Pick<QuestionBase, "id" | "topicId" | "difficulty" | "prompt">;
export type PublicPracticeQuestion =
  | (PublicBase & Pick<MultipleChoiceQuestion, "kind" | "options">)
  | (PublicBase & Pick<ShortAnswerQuestion, "kind">)
  | (PublicBase & Pick<CodingQuestion, "kind" | "language" | "example">);
export type SavedPractice =
  | { status: "saved"; kind: "graded"; selectedId: string; correctOptionId: string; isCorrect: boolean; explanation: string }
  | { status: "saved"; kind: "self-review"; draft: string; solution: string; explanation: string };
export type PracticeResult = SavedPractice | { status: "empty" } | { status: "error"; message: string };
