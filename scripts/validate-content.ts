import { careerPaths, topics } from "../src/data/mock/curriculum.ts";
import { lessons } from "../src/data/mock/lessons.ts";
import { questions } from "../src/data/mock/questions.ts";
import { topicProgress, demoStats } from "../src/data/mock/progress.ts";
import { validateContent } from "../src/data/mock/validate-content.ts";

// Node 24 strips type-only syntax, so these content checks do not require installed npm packages.
const issues = validateContent({ careerPaths, topics, lessons, questions, topicProgress });
if (demoStats.correct > demoStats.answered) issues.push("Aggregate correct answers exceed attempts.");

if (issues.length) {
  console.error(issues.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Content structure passed: ${careerPaths.length} paths, ${topics.length} topics, ${lessons.length} lessons, ${questions.length} questions.`);
  console.log("Answer mappings, lesson checks, references, and progress totals are internally consistent. This is not a publication review.");
}
