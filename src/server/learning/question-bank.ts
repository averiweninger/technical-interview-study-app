import "server-only";
import { questions } from "@/data/mock/questions";
import type { PracticeQuestion, PublicPracticeQuestion } from "@/features/practice/types";

export function publicQuestion(question: PracticeQuestion): PublicPracticeQuestion {
  const base = { id: question.id, topicId: question.topicId, difficulty: question.difficulty, prompt: question.prompt };
  if (question.kind === "multiple-choice") return { ...base, kind: question.kind, options: question.options.map(({ id, text }) => ({ id, text })) };
  if (question.kind === "coding") return { ...base, kind: question.kind, language: question.language, example: question.example };
  return { ...base, kind: question.kind };
}
export function publicQuestions() { return questions.map(publicQuestion); }
