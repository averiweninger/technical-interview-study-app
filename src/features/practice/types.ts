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
