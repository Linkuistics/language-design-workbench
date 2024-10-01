# Testing and Debugging Guide

This guide provides instructions for iterative testing and debugging of the LDWM
source generation and parsing process using ClaudeDev.

## Iterative Testing Prompt

Use the following prompt with ClaudeDev to perform iterative testing and debugging:

```markdown
Task: Iteratively test and debug the LDWM source generation and parsing process

CRITICAL: When using file operation commands (read_file, write_to_file, etc.),
always include the COMPLETE content of the file. DO NOT elide or omit any part
of the source code. Partial updates or placeholders like '// rest of code
unchanged' are strictly forbidden. This is crucial to maintain the integrity of
the codebase and prevent introducing errors.

Steps:

1. Run the specific Jest test file using the command:
   npx jest tests/languages/ldwm/new-passes/to_ldwm_source.test.ts

2. Analyze the test results and error messages.

3. If errors occur:

    1. Examine the relevant source files (ToLDWMSource, FromLDWMSource, test file).
    2. Identify potential issues in the code.
    3. Propose and implement fixes.
    4. If you discover any new insights, best practices, or important
       considerations, update this prompt in the Testing.md file to reflect these
       learnings. This will ensure that future testing sessions benefit from
       accumulated knowledge.
    5. Re-run the test to verify the fixes.

4. If no errors occur, but you want to improve test coverage:

    1. Analyze the current test cases.
    2. Propose additional test cases or improvements to existing ones.
    3. Implement the new test cases.
    4. Run the test again to ensure new tests pass and don't break existing functionality.

5. Repeat steps 1-4 until all tests pass and you're satisfied with the test coverage.

After each iteration, provide a summary of:

-   Changes made
-   Test results
-   Next steps or recommendations

If you need to view or modify any files, use the appropriate file operation
commands (read_file, write_to_file, etc.). Remember to always include the
complete file content when using these commands.

Important:

1. Ensure that all generated identifiers in the LDWM models conform to the
   grammar rules specified in src/languages/ldwm/ldwm.ldwg. Valid identifiers must
   start with a letter or underscore, followed by letters, numbers, or underscores.
2. The LDWM parser only handles one model per file. Ensure that test cases
   respect this constraint and do not attempt to parse multiple models in a single
   LDWM source string.
3. Indentation, and whitespace in general, are highly unlikely to be the source
   of errors.

If you encounter any issues related to incomplete file content or elided code,
immediately stop and request the complete file content before proceeding.

Begin the iterative testing and debugging process.
```

Use this prompt with ClaudeDev to perform thorough testing and debugging of the
LDWM source generation and parsing process. Follow ClaudeDev's instructions and
provide any additional information or feedback as requested. Continue the
iterative process until all tests pass and you're satisfied with the test
coverage and functionality.

Remember to update relevant documentation and comments in the code as you make
changes during this process.
