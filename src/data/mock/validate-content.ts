import type { CareerPath, Lesson, Topic } from "../../features/curriculum/types";
import type { PracticeQuestion } from "../../features/practice/types";
import type { TopicProgress } from "./progress";

export interface DemoContent {
  careerPaths: CareerPath[];
  topics: Topic[];
  lessons: Lesson[];
  questions: PracticeQuestion[];
  topicProgress: TopicProgress[];
}

// Validate relationships and answer structure before treating a content edit as ready to review.
// These checks catch structural mistakes; educational accuracy still needs human review.
export function validateContent(content: DemoContent): string[] {
  const issues: string[] = [];
  const topicIds = new Set(content.topics.map((topic) => topic.id));

  for (const [name, records] of Object.entries({ paths: content.careerPaths, topics: content.topics, lessons: content.lessons, questions: content.questions })) {
    const ids = records.map((record) => record.id);
    if (new Set(ids).size !== ids.length) issues.push(`Duplicate ${name} IDs.`);
    if (ids.some((id) => !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id))) issues.push(`Invalid ${name} ID slug.`);
  }

  for (const path of content.careerPaths) {
    if (new Set(path.topicIds).size !== path.topicIds.length) issues.push(`${path.id}: duplicate mapped topics.`);
    if (!path.topicIds.length || path.topicIds.some((id) => !topicIds.has(id))) issues.push(`${path.id}: invalid topic mapping.`);
  }

  for (const lesson of content.lessons) {
    if (!topicIds.has(lesson.topicId)) issues.push(`${lesson.id}: missing topic.`);
    const check = content.questions.find((question) => question.id === lesson.checkQuestionId);
    if (!check || check.kind !== "multiple-choice" || check.topicId !== lesson.topicId) issues.push(`${lesson.id}: knowledge check must be multiple-choice and belong to the lesson topic.`);
    if (!lesson.objectives.length || !lesson.sections.length || lesson.sections.some((section) => !section.title.trim() || !section.body.trim())) issues.push(`${lesson.id}: missing educational content.`);
    if (!Number.isInteger(lesson.minutes) || lesson.minutes <= 0) issues.push(`${lesson.id}: invalid duration.`);
    if (!lesson.reference.url.startsWith("https://")) issues.push(`${lesson.id}: reference must use HTTPS.`);
  }

  for (const question of content.questions) {
    if (!topicIds.has(question.topicId)) issues.push(`${question.id}: missing topic.`);
    if (!question.prompt.trim() || !question.explanation.trim()) issues.push(`${question.id}: missing prompt or explanation.`);
    if (question.kind === "multiple-choice") {
      const ids = question.options.map((option) => option.id);
      const texts = question.options.map((option) => option.text.trim().toLowerCase());
      if (ids.length < 2 || new Set(ids).size !== ids.length || new Set(texts).size !== texts.length || texts.includes("")) issues.push(`${question.id}: choices must be distinct and nonempty.`);
      if (ids.filter((id) => id === question.correctOptionId).length !== 1) issues.push(`${question.id}: exactly one choice must match the key.`);
    } else if (question.kind === "short-answer" && !question.modelAnswer.trim()) {
      issues.push(`${question.id}: missing model answer.`);
    } else if (question.kind === "coding" && (!question.solution.trim() || !question.example.trim())) {
      issues.push(`${question.id}: missing exercise example or solution.`);
    }
  }

  if (new Set(content.topicProgress.map((row) => row.topicId)).size !== content.topicProgress.length) issues.push("Duplicate topic progress records.");
  for (const row of content.topicProgress) {
    if (!topicIds.has(row.topicId)) issues.push(`${row.topicId}: progress references missing topic.`);
    if (row.completion < 0 || row.completion > 100 || !Number.isFinite(row.completion)) issues.push(`${row.topicId}: invalid completion.`);
    if (!Number.isInteger(row.answered) || !Number.isInteger(row.correct) || row.answered < 0 || row.correct < 0 || row.correct > row.answered) issues.push(`${row.topicId}: invalid answer totals.`);
    if ((row.answered === 0) !== (row.mastery === "Not assessed")) issues.push(`${row.topicId}: unassessed label conflicts with sample evidence.`);
  }

  return issues;
}
