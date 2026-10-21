import type { Lesson } from "../../features/curriculum/types";

// Educational samples, not the reviewed/published curriculum promised by the full Phase 1 plan.
export const lessons: Lesson[] = [
  {


    id: "python-variables",

    topicId: "python",

    title: "Variables and data types",

    minutes: 8,


    objectives: ["Assign descriptive names to values.", "Distinguish integers, floats, strings, and booleans.", "Explain the difference between assignment and equality."],


    sections: [
      {

        title: "Give a value a name",

        body: "A variable is a name that refers to a value. Assignment uses a single equals sign. Python determines the type of the value at runtime; you do not declare a type before using a name. Prefer names that describe the value's purpose.",

        code: 'questions_answered = 12\naccuracy = 0.75\nlearner_name = "Alex"\nis_ready = False'

      },
      {

        title: "Know the basic types",

        body: "An int represents a whole number, a float represents a floating-point number, a str stores text, and a bool is True or False. Quotes matter: 12 is an integer, while \"12\" is a string. You can inspect a value with type(), or explicitly convert suitable values with int(), float(), or str().",

        code: 'count = int("12")\nprint(count + 3)  # 15\nprint(type(count).__name__)  # int'

      },
      {

        title: "Assignment is different from comparison",

        body: "Use = to bind a name and == to compare values. A comparison produces a boolean. Python names can later refer to a different type, but repeatedly changing what a name means makes code harder to understand.",

        code: 'score = 8\npassed = score == 8\nprint(passed)  # True'

      },
    ],


    takeaway: "Choose descriptive names, pay attention to value types, and use == when comparing values.",

    checkQuestionId: "python-types",


    reference: { title: "Python tutorial: An informal introduction", url: "https://docs.python.org/3/tutorial/introduction.html" },


  },
  {


    id: "python-loops",

    topicId: "python",

    title: "Loops and iteration",

    minutes: 10,


    objectives: ["Iterate over a sequence with for.", "Use range() without an off-by-one error.", "Explain when a while loop terminates."],


    sections: [
      {

        title: "Repeat work with for",

        body: "A for loop visits each item in an iterable, such as a list or string. The indented body runs once for each item. Use a for loop when you want to process a collection rather than manually managing an index.",

        code: 'topics = ["Python", "SQL", "Algorithms"]\nfor topic in topics:\n    print(topic)'

      },
      {

        title: "Understand the stopping point",

        body: "range(3) produces 0, 1, and 2. Its stop value is excluded. range(1, 4) produces 1, 2, and 3. When tracing a loop in an interview, write out a small example to check its boundaries.",

        code: 'total = 0\nfor number in range(1, 4):\n    total += number\nprint(total)  # 6'

      },
      {

        title: "Repeat while a condition holds",

        body: "A while loop checks a condition before every iteration. Its body must eventually make that condition false, unless it intentionally exits with break. If the condition never changes, the loop may run forever.",

        code: 'remaining = 3\nwhile remaining > 0:\n    print(remaining)\n    remaining -= 1'

      },
    ],


    takeaway: "Use for for collection traversal and while for condition-driven repetition. Check your termination condition.",

    checkQuestionId: "python-range",


    reference: { title: "Python tutorial: Control flow", url: "https://docs.python.org/3/tutorial/controlflow.html" },


  },
  {


    id: "python-lists",

    topicId: "python",

    title: "Lists and everyday operations",

    minutes: 9,


    objectives: ["Read and update list elements.", "Use append(), len(), and slicing.", "Recognize that lists are mutable."],


    sections: [
      {

        title: "Keep an ordered collection",

        body: "A list stores an ordered sequence of values. Indexing starts at zero, so the first item is at index 0. A negative index counts backward from the end. Accessing an index outside the list raises IndexError.",

        code: 'scores = [70, 85, 90]\nprint(scores[0])   # 70\nprint(scores[-1])  # 90'

      },
      {

        title: "Change a list in place",

        body: "Lists are mutable: you can replace elements and append new ones. append() changes the existing list and returns None. Do not assign its result back to the list name. len() returns the number of elements.",

        code: 'scores = [70, 85]\nscores[0] = 75\nscores.append(90)\nprint(scores)       # [75, 85, 90]\nprint(len(scores))  # 3'

      },
      {

        title: "Take a slice",

        body: "A slice such as scores[0:2] returns a new list containing indexes 0 and 1. The stop index is excluded, just like range(). Assigning one list name to another does not copy it: both names refer to the same list. A slice creates a shallow copy of the selected portion.",

        code: 'scores = [75, 85, 90]\nfirst_two = scores[:2]\nprint(first_two)  # [75, 85]'

      },
    ],


    takeaway: "Lists are ordered and mutable. Remember zero-based indexing and the excluded stop in slices.",

    checkQuestionId: "python-list",


    reference: { title: "Python tutorial: Data structures", url: "https://docs.python.org/3/tutorial/datastructures.html" },


  },
  {


    id: "sql-select",

    topicId: "sql",

    title: "Your first SELECT statement",

    minutes: 8,


    objectives: ["Choose columns with SELECT and a table with FROM.", "Filter rows with WHERE.", "Request an explicit sort order with ORDER BY."],


    sections: [
      {

        title: "Describe the result you want",

        body: "SQL is declarative: a query describes a desired result, and the database chooses how to obtain it. SELECT lists the columns to return; FROM identifies the table. Naming columns explicitly helps make the result predictable.",

        code: 'SELECT name, department\nFROM employees;'

      },
      {

        title: "Filter rows",

        body: "WHERE retains rows whose condition evaluates to true. Text literals use single quotes. Numeric comparisons can use operators such as >=. In this example, the query returns only employees in Engineering with a salary of at least 70000.",

        code: "SELECT name, salary\nFROM employees\nWHERE department = 'Engineering'\n  AND salary >= 70000;"

      },
      {

        title: "Make ordering explicit",

        body: "Without ORDER BY, row order is unspecified. ASC sorts ascending and DESC sorts descending. Add a secondary sort column when you need predictable ordering among tied values.",

        code: 'SELECT name, salary\nFROM employees\nORDER BY salary DESC, name ASC;'

      },
    ],


    takeaway: "SELECT chooses columns, WHERE filters rows, and ORDER BY requests a result order.",

    checkQuestionId: "sql-filter",


    reference: { title: "PostgreSQL tutorial: Querying a table", url: "https://www.postgresql.org/docs/current/tutorial-select.html" },


  },
  {


    id: "sql-joins",

    topicId: "sql",

    title: "Connecting tables with JOIN",

    minutes: 12,


    objectives: ["Join tables using related columns.", "Distinguish INNER JOIN from LEFT JOIN.", "Recognize that multiple matches can produce multiple rows."],


    sections: [
      {

        title: "Connect related records",

        body: "Suppose employees has id, name, and department_id columns, while departments has id and name. A join combines rows according to a condition. Aliases such as e and d make column references shorter and avoid ambiguous names.",

        code: 'SELECT e.name, d.name AS department\nFROM employees AS e\nINNER JOIN departments AS d\n  ON e.department_id = d.id;'

      },
      {

        title: "Choose which unmatched rows to keep",

        body: "INNER JOIN keeps matching combinations only. LEFT JOIN also keeps every row from the left table. When a left row has no match, columns from the right table are NULL. This makes LEFT JOIN useful when missing relationships are meaningful.",

        code: 'SELECT e.name, d.name AS department\nFROM employees AS e\nLEFT JOIN departments AS d\n  ON e.department_id = d.id;'

      },
      { title: "Think about cardinality", body: "A join does not guarantee one output row per input row. If one customer has three orders, joining that customer to orders produces three matching rows. Check uniqueness and one-to-many relationships before interpreting counts. A WHERE filter on right-table columns can remove unmatched rows from a LEFT JOIN." },
    ],


    takeaway: "Pick a join based on the rows you want to preserve, and inspect how many matches each row can have.",

    checkQuestionId: "sql-left-join",


    reference: { title: "PostgreSQL tutorial: Joins between tables", url: "https://www.postgresql.org/docs/current/tutorial-join.html" },


  },
  {


    id: "big-o",

    topicId: "algorithms",

    title: "Introduction to Big O notation",

    minutes: 11,


    objectives: ["Describe how work grows with input size.", "Compare constant, linear, and quadratic growth.", "State the input and case you are analyzing."],


    sections: [
      { title: "Describe growth, not stopwatch time", body: "Big O describes an asymptotic upper bound on growth. It helps compare algorithms as input size n increases. It is not an exact runtime measurement. In interviews, specify what n represents and whether you mean worst-case, average-case, or another setting." },
      {

        title: "Count the repeated work",

        body: "Reading one array element is constant-time under the usual random-access model. Visiting each of n elements once takes linear work, O(n). A pair of loops that each visit n elements and perform constant work in the body does n × n operations, giving O(n²).",

        code: 'for first in items:\n    for second in items:\n        compare(first, second)'

      },
      { title: "Ignore constants, preserve the dominant term", body: "Two consecutive scans take approximately 2n operations, which is O(n). Work proportional to n² + n is O(n²). Nested loops are not automatically quadratic: their iteration counts matter. State assumptions, such as compare() taking constant time." },
    ],


    takeaway: "Define the input size, count repeated operations, and keep the dominant growth term.",

    checkQuestionId: "complexity-scan",


    reference: { title: "MIT OpenCourseWare: Introduction to Algorithms", url: "https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/" },


  },
];
