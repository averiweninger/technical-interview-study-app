// These are frontend content contracts, not generated database types.
// IDs connect records so the same topic can appear in several career paths.
export type Difficulty = "Beginner" | "Intermediate";

export interface CareerPath {
  id: string;
  name: string;
  description: string;
  focus: string;
  topicIds: string[];
}

export interface Topic {
  id: string;
  name: string;
  category: string;
  description: string;
  difficulty: Difficulty;
  accent: "teal" | "blue" | "amber" | "violet";
  symbol: string;
}

export interface LessonSection {
  title: string;
  body: string;
  code?: string;
}

export interface Lesson {
  id: string;
  topicId: string;
  title: string;
  minutes: number;
  objectives: string[];
  sections: LessonSection[];
  takeaway: string;
  checkQuestionId: string;
  reference: { title: string; url: string; };
}
