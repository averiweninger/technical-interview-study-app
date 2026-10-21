import { describe, expect, it } from "vitest";
import { careerPaths, topics } from "../../src/data/mock/curriculum";
import { lessons } from "../../src/data/mock/lessons";
import { questions } from "../../src/data/mock/questions";
import { topicProgress } from "../../src/data/mock/progress";
import { validateContent, type DemoContent } from "../../src/data/mock/validate-content";

const content: DemoContent = { careerPaths, topics, lessons, questions, topicProgress };

describe("content integrity", () => {
  it("accepts the connected sample curriculum", () => {
    expect(validateContent(content)).toEqual([]);
  });
  it("rejects an answer key that does not match any option", () => {
    const broken = structuredClone(content);
    const question = broken.questions.find((item) => item.kind === "multiple-choice")!;
    if (question.kind === "multiple-choice") question.correctOptionId = "missing";
    expect(validateContent(broken).some((issue) => issue.includes("exactly one choice"))).toBe(true);
  });
  it("rejects cross-topic lesson checks and invalid performance totals", () => {
    const broken = structuredClone(content);
    broken.lessons[0].checkQuestionId = "sql-filter";
    broken.topicProgress[0].correct = broken.topicProgress[0].answered + 1;
    const issues = validateContent(broken);
    expect(issues.some((issue) => issue.includes("lesson topic"))).toBe(true);
    expect(issues.some((issue) => issue.includes("invalid answer totals"))).toBe(true);
  });
});
