// Illustrative records only. Quiz interactions never update these numbers or imply real mastery.
export interface TopicProgress {
  topicId: string;
  completion: number;
  answered: number;
  correct: number;
  mastery: "Developing" | "Needs practice" | "Not assessed";
}

export const topicProgress: TopicProgress[] = [
  { topicId: "python", completion: 67, answered: 20, correct: 17, mastery: "Developing" },
  { topicId: "sql", completion: 50, answered: 16, correct: 11, mastery: "Developing" },
  { topicId: "javascript", completion: 0, answered: 0, correct: 0, mastery: "Not assessed" },
  { topicId: "data-structures", completion: 25, answered: 8, correct: 6, mastery: "Developing" },
  { topicId: "algorithms", completion: 33, answered: 10, correct: 4, mastery: "Needs practice" },
  { topicId: "cs-fundamentals", completion: 0, answered: 0, correct: 0, mastery: "Not assessed" },
  { topicId: "statistics", completion: 0, answered: 0, correct: 0, mastery: "Not assessed" },
  { topicId: "problem-solving", completion: 25, answered: 6, correct: 4, mastery: "Developing" },
];

// Display-ready labels keep these examples independent of the computer's current date.
export const studyActivity = [
  { day: "Mon", minutes: 25 }, { day: "Tue", minutes: 40 }, { day: "Wed", minutes: 30 },
  { day: "Thu", minutes: 0 }, { day: "Fri", minutes: 45 }, { day: "Sat", minutes: 20 }, { day: "Sun", minutes: 35 },
];

export const recentActivity = [
  { title: "Practiced SQL joins", detail: "8 example questions · 6 correct", label: "2 hours ago", href: "/practice?topic=sql" },
  { title: "Studied Python lists", detail: "Lesson activity · 9 minutes", label: "Yesterday", href: "/lessons/python-lists" },
  { title: "Explored algorithm complexity", detail: "10 example questions · 4 correct", label: "Yesterday", href: "/lessons/big-o" },
];

export const upcomingReviews = [
  { title: "SQL joins", label: "Today", href: "/lessons/sql-joins" },
  { title: "Python lists", label: "Tomorrow", href: "/lessons/python-lists" },
  { title: "Big O notation", label: "In 2 days", href: "/lessons/big-o" },
];

// Derive shared totals in one place so dashboard and analytics always agree.
export const demoStats = {


  completion: Math.round(topicProgress.reduce((sum, row) => sum + row.completion, 0) / topicProgress.length),


  answered: topicProgress.reduce((sum, row) => sum + row.answered, 0),


  correct: topicProgress.reduce((sum, row) => sum + row.correct, 0),


  activeTopics: topicProgress.filter((row) => row.answered > 0).length,


  streak: 3,
};
