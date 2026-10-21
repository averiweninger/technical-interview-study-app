import type { CareerPath, Topic } from "../../features/curriculum/types";

// Public demonstration content. These records will be replaced by published-content queries later.
export const topics: Topic[] = [
  {

    id: "python",

    name: "Python",

    category: "Programming",

    description: "Build a solid foundation in variables, loops, and everyday data structures.",

    difficulty: "Beginner",

    accent: "teal",

    symbol: "Py"

  },
  {

    id: "sql",

    name: "SQL",

    category: "Data",

    description: "Ask better questions of data with queries, filters, and relational joins.",

    difficulty: "Beginner",

    accent: "blue",

    symbol: "SQL"

  },
  {

    id: "javascript",

    name: "JavaScript",

    category: "Programming",

    description: "Explore the language behind interactive web applications.",

    difficulty: "Beginner",

    accent: "amber",

    symbol: "JS"

  },
  {

    id: "data-structures",

    name: "Data Structures",

    category: "Foundations",

    description: "Understand arrays, maps, stacks, and the tradeoffs behind each choice.",

    difficulty: "Intermediate",

    accent: "violet",

    symbol: "[ ]"

  },
  {

    id: "algorithms",

    name: "Algorithms",

    category: "Foundations",

    description: "Reason about efficiency, search strategies, and problem-solving patterns.",

    difficulty: "Intermediate",

    accent: "teal",

    symbol: "O(n)"

  },
  {

    id: "cs-fundamentals",

    name: "Computer Science Fundamentals",

    category: "Foundations",

    description: "Connect core ideas in memory, networks, and relational data.",

    difficulty: "Beginner",

    accent: "blue",

    symbol: "01"

  },
  {

    id: "statistics",

    name: "Statistics",

    category: "Data",

    description: "Interpret distributions, averages, uncertainty, and probability.",

    difficulty: "Beginner",

    accent: "violet",

    symbol: "Σ"

  },
  {

    id: "problem-solving",

    name: "Technical Problem-Solving",

    category: "Foundations",

    description: "Clarify requirements, test assumptions, and explain your reasoning.",

    difficulty: "Beginner",

    accent: "amber",

    symbol: "?"

  },
];

export const careerPaths: CareerPath[] = [
  {

    id: "software-engineering",

    name: "Software Engineering",

    description: "Build reliable software and explain the decisions behind your solutions.",

    focus: "Build & engineer",

    topicIds: ["python", "javascript", "data-structures", "algorithms", "cs-fundamentals", "problem-solving"]

  },
  {

    id: "data-analytics",

    name: "Data Analytics",

    description: "Turn raw data into clear answers and useful business insights.",

    focus: "Query & interpret",

    topicIds: ["sql", "python", "statistics", "problem-solving"]

  },
  {

    id: "data-science",

    name: "Data Science",

    description: "Combine programming and statistical thinking to investigate data.",

    focus: "Explore & model",

    topicIds: ["python", "sql", "statistics", "algorithms", "problem-solving"]

  },
  {

    id: "business-analytics",

    name: "Business Analytics",

    description: "Frame business questions, evaluate evidence, and communicate findings.",

    focus: "Analyze & communicate",

    topicIds: ["sql", "statistics", "cs-fundamentals", "problem-solving"]

  },
  {

    id: "technology-consulting",

    name: "Technology Consulting",

    description: "Connect technical foundations to practical client problems.",

    focus: "Connect & advise",

    topicIds: ["sql", "python", "cs-fundamentals", "problem-solving"]

  },
  {

    id: "general-technical",

    name: "General Technical Interview Preparation",

    description: "Develop a broad foundation before narrowing your preparation.",

    focus: "Explore the essentials",

    topicIds: ["python", "sql", "data-structures", "algorithms", "cs-fundamentals", "statistics", "problem-solving", "javascript"]

  },
];
