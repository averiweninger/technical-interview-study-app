import "server-only";
import type { PracticeQuestion } from "../../features/practice/types";

// Server-only sample bank. Previously public keys are unsuitable for mastery/secure assessments.
export const questions: PracticeQuestion[] = [
  {

    id: "python-types",

    topicId: "python",

    kind: "multiple-choice",

    difficulty: "Beginner",

    prompt: 'What is the type of the value assigned by count = "12"?',

    options: [{ id: "a", text: "Integer (int)" }, { id: "b", text: "String (str)" }, { id: "c", text: "Float (float)" }, { id: "d", text: "Boolean (bool)" }],

    correctOptionId: "b",

    explanation: 'Quotation marks make "12" a string. Use int("12") if you need the integer 12 for arithmetic.'

  },
  {

    id: "python-range",

    topicId: "python",

    kind: "multiple-choice",

    difficulty: "Beginner",

    prompt: "Which values does range(1, 4) produce?",

    options: [{ id: "a", text: "1, 2, 3" }, { id: "b", text: "1, 2, 3, 4" }, { id: "c", text: "0, 1, 2, 3" }, { id: "d", text: "2, 3, 4" }],

    correctOptionId: "a",

    explanation: "The starting value is included and the stopping value is excluded. range(1, 4) produces 1, 2, and 3."

  },
  {

    id: "python-list",

    topicId: "python",

    kind: "multiple-choice",

    difficulty: "Beginner",

    prompt: "After values = [10, 20, 30], what is values[1]?",

    options: [{ id: "a", text: "10" }, { id: "b", text: "20" }, { id: "c", text: "30" }, { id: "d", text: "An IndexError" }],

    correctOptionId: "b",

    explanation: "Python lists use zero-based indexing. Index 0 is 10, index 1 is 20, and index 2 is 30."

  },
  {

    id: "sql-filter",

    topicId: "sql",

    kind: "multiple-choice",

    difficulty: "Beginner",

    prompt: "Which SQL clause filters individual rows before grouping?",

    options: [{ id: "a", text: "ORDER BY" }, { id: "b", text: "SELECT" }, { id: "c", text: "WHERE" }, { id: "d", text: "HAVING" }],

    correctOptionId: "c",

    explanation: "WHERE filters individual rows. HAVING filters groups after grouping, and ORDER BY controls the result order."

  },
  {

    id: "sql-left-join",

    topicId: "sql",

    kind: "multiple-choice",

    difficulty: "Beginner",

    prompt: "Which join keeps every employee, including employees with no matching department?",

    options: [{ id: "a", text: "employees INNER JOIN departments" }, { id: "b", text: "employees LEFT JOIN departments" }, { id: "c", text: "employees CROSS JOIN departments" }],

    correctOptionId: "b",

    explanation: "A LEFT JOIN preserves the left table's rows. For an employee with no match, the department columns are NULL."

  },
  {

    id: "complexity-scan",

    topicId: "algorithms",

    kind: "multiple-choice",

    difficulty: "Intermediate",

    prompt: "What is the tightest Big O bound listed for scanning n items once, with constant work per item?",

    options: [{ id: "a", text: "O(1)" }, { id: "b", text: "O(log n)" }, { id: "c", text: "O(n)" }, { id: "d", text: "O(n²)" }],

    correctOptionId: "c",

    explanation: "The work grows in proportion to n. O(n²) is also an upper bound, but O(n) is the tightest bound among these choices."

  },
  {

    id: "javascript-const",

    topicId: "javascript",

    kind: "multiple-choice",

    difficulty: "Beginner",

    prompt: "What does const prevent in JavaScript?",

    options: [{ id: "a", text: "Reassigning the variable binding" }, { id: "b", text: "Changing any property of an object" }, { id: "c", text: "Calling methods on an array" }],

    correctOptionId: "a",

    explanation: "const prevents reassignment of the binding. It does not make a referenced object or array immutable."

  },
  {

    id: "stack-concept",

    topicId: "data-structures",

    kind: "short-answer",

    difficulty: "Beginner",

    prompt: "Explain a stack's ordering rule and give one use case.",

    modelAnswer: "A stack follows last in, first out (LIFO): the most recently pushed item is the first one popped. An undo history can use a stack to reverse the most recent action first.",

    explanation: "Check that your answer states LIFO and connects the example to removing the newest item first. This is self-review, not an automatic grade."

  },
  {

    id: "relational-key",

    topicId: "cs-fundamentals",

    kind: "short-answer",

    difficulty: "Beginner",

    prompt: "How do a primary key and a foreign key differ?",

    modelAnswer: "A primary key uniquely identifies a row and cannot be NULL. A foreign key constrains a reference to a key in another table (or the same table), helping maintain referential integrity.",

    explanation: "Look for both row identity and relationship integrity in your explanation. A foreign key is not necessarily unique."

  },
  {

    id: "mean-median",

    topicId: "statistics",

    kind: "multiple-choice",

    difficulty: "Beginner",

    prompt: "What is the median of 2, 3, 4, 5, 100?",

    options: [{ id: "a", text: "4" }, { id: "b", text: "22.8" }, { id: "c", text: "5" }],

    correctOptionId: "a",

    explanation: "The median is the middle value of the sorted data: 4. The mean is 22.8 and is pulled upward by the large outlier."

  },
  {

    id: "clarify-problem",

    topicId: "problem-solving",

    kind: "short-answer",

    difficulty: "Beginner",

    prompt: "Before implementing a function that finds duplicate values, what should you clarify?",

    modelAnswer: "Ask about the input type and size, what counts as a duplicate, whether output should list each duplicate once, whether order matters, and any memory or mutation constraints. Confirm behavior for empty input.",

    explanation: "There is no single wording to match. Compare your answer for clear requirements, constraints, and edge cases."

  },
  {

    id: "python-sum-exercise",

    topicId: "python",

    kind: "coding",

    language: "Python",

    difficulty: "Beginner",

    prompt: "Write sum_even(numbers), which returns the sum of the even integers in a list. An empty list should return 0.",

    example: "sum_even([1, 2, 3, 4]) → 6\nsum_even([]) → 0",

    solution: "def sum_even(numbers):\n    total = 0\n    for number in numbers:\n        if number % 2 == 0:\n            total += number\n    return total",

    explanation: "Check each value with % 2 == 0 and add even values to the total. This takes O(n) time and O(1) extra space. The exercise is displayed only; no code is executed."

  },
  {

    id: "sql-query-exercise",

    topicId: "sql",

    kind: "coding",

    language: "SQL",

    difficulty: "Beginner",

    prompt: "Given employees(id, name, salary), write a query for names and salaries of employees earning at least 70000, highest salary first. Break ties by name ascending.",

    example: "employees: (1, 'Alex', 80000), (2, 'Sam', 65000)\nExpected columns: name, salary\nExpected row: Alex, 80000",

    solution: "SELECT name, salary\nFROM employees\nWHERE salary >= 70000\nORDER BY salary DESC, name ASC;",

    explanation: "WHERE filters salaries, and ORDER BY makes the requested ordering explicit. The query is an example solution; no database is connected."

  },
];
