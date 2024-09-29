# Testing and Debugging Guide

This guide provides instructions for iterative testing and debugging of the LDWM source generation and parsing process using ClaudeDev.

## Iterative Testing Prompt

Use the following prompt with ClaudeDev to perform iterative testing and debugging:

```
Task: Iteratively test and debug the LDWM source generation and parsing process

Steps:
1. Run the Jest test suite using the command: npm test

2. Analyze the test results and error messages.

3. If errors occur:
   a. Examine the relevant source files (ToLDWMSource, FromLDWMSource, test file).
   b. Identify potential issues in the code.
   c. Propose and implement fixes.
   d. Re-run the tests to verify the fixes.

4. If no errors occur, but you want to improve test coverage:
   a. Analyze the current test cases.
   b. Propose additional test cases or improvements to existing ones.
   c. Implement the new test cases.
   d. Run the tests again to ensure new tests pass and don't break existing functionality.

5. Repeat steps 1-4 until all tests pass and you're satisfied with the test coverage.

6. If you discover any new insights, best practices, or important considerations during the process, update this prompt in the Testing.md file to reflect these learnings. This will ensure that future testing sessions benefit from accumulated knowledge.

After each iteration, provide a summary of:
- Changes made
- Test results
- Next steps or recommendations

If you need to view or modify any files, use the appropriate file operation commands (read_file, write_to_file, etc.).

Important: Ensure that all generated identifiers in the LDWM models conform to the grammar rules specified in src/languages/ldwm/ldwm.ldwg. Valid identifiers must start with a letter or underscore, followed by letters, numbers, or underscores.

Begin the iterative testing and debugging process.
```

## Instructions for Use

1. Copy the above prompt and paste it into your conversation with ClaudeDev.
2. Follow ClaudeDev's instructions and provide any additional information or feedback as requested.
3. Continue the iterative process until all tests pass and you're satisfied with the test coverage and functionality.

Remember to update relevant documentation and comments in the code as you make changes during this process.
