import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { gradeAnswer } from "../../src/features/practice/grade-answer";
import type { MultipleChoiceQuestion } from "../../src/features/practice/types";

const question: MultipleChoiceQuestion = {


  id: "test-question",

  topicId: "python",

  kind: "multiple-choice",

  difficulty: "Beginner",


  prompt: "Which value is an integer?",

  options: [{ id: "integer", text: "12" }, { id: "string", text: '\"12\"' }],


  correctOptionId: "integer",

  explanation: "Unquoted 12 is an integer.",
};

describe("demonstration grading", () => {
  it("distinguishes correct and incorrect valid choices", () => {
    expect(gradeAnswer(question, "integer")).toMatchObject({ status: "graded", isCorrect: true });
    expect(gradeAnswer(question, "string")).toMatchObject({ status: "graded", isCorrect: false });
  });
  it("rejects choices not belonging to the question", () => {
    expect(gradeAnswer(question, "forged")).toMatchObject({ status: "invalid" });
    expect(gradeAnswer(question, "")).toMatchObject({ status: "invalid" });
  });
});
