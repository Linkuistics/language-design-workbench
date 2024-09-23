# Backtracking and Alternatives

This section focuses on the backtracking nature of our parser infrastructure and how to effectively work with ordered choice alternatives. Understanding these concepts is crucial for building flexible and powerful parsers.

## Table of Contents

- [Backtracking and Alternatives](#backtracking-and-alternatives)
  - [Table of Contents](#table-of-contents)
  - [Introduction to Backtracking and Alternatives](#introduction-to-backtracking-and-alternatives)
  - [How Backtracking Works](#how-backtracking-works)
  - [Using the Alternatives Method](#using-the-alternatives-method)
  - [Implementing Ordered Choice](#implementing-ordered-choice)
  - [Performance Considerations](#performance-considerations)
  - [Best Practices](#best-practices)
  - [Examples](#examples)
    - [Example 1: Parser with Ambiguous Syntax](#example-1-parser-with-ambiguous-syntax)
    - [Example 2: Optimized Parser with Lookahead](#example-2-optimized-parser-with-lookahead)

## Introduction to Backtracking and Alternatives

Backtracking is a powerful technique in parsing that allows the parser to try multiple paths through the input, backing up when a particular path fails to match. This is particularly useful when dealing with ambiguous grammars or when you need to try multiple alternative productions for a given rule.

Our parser infrastructure provides built-in support for backtracking through the `alternatives` method, which implements ordered choice between different parsing alternatives.

## How Backtracking Works

In our parser infrastructure, backtracking is implemented using the `restorePosition` method of the `InputStream` interface. When the parser encounters an alternative, it saves its current position. If the current alternative fails to parse, the parser restores its position to the saved point and tries the next alternative.

This process continues until either a successful parse is found or all alternatives have been exhausted. If all alternatives fail, the parser reports an error.

## Using the Alternatives Method

The `alternatives` method is a key component in implementing backtracking and ordered choice. It takes multiple parsing functions as arguments and tries each one in order until one succeeds. Here's a basic example:

```typescript
parseExpression(): ExpressionNode {
  return this.alternatives(
    () => this.parseNumber(),
    () => this.parseIdentifier(),
    () => this.parseParenthesizedExpression()
  );
}
```

In this example, the parser will first try to parse a number. If that fails, it will then try to parse an identifier. If that also fails, it will finally try to parse a parenthesized expression.

## Implementing Ordered Choice

Ordered choice is naturally implemented using the `alternatives` method. The order in which you provide the alternatives matters - the parser will try them in the order they are given. This allows you to implement precedence rules and handle ambiguities in your grammar.

## Performance Considerations

While backtracking is powerful, it can potentially lead to performance issues if not used carefully. Each time the parser backtracks, it has to re-parse a portion of the input. In complex grammars with many alternatives, this can lead to exponential time complexity.

To mitigate this, consider the following:

1. Order your alternatives from most specific to least specific.
2. Use left-factoring to reduce the need for backtracking.
3. Consider using lookahead to make early decisions about which alternative to take.

## Best Practices

1. Use meaningful names for your parsing methods to make the grammar structure clear.
2. Keep individual parsing methods focused on a single grammar rule or concept.
3. Use error messages that provide context about what the parser was expecting.
4. Be mindful of the order of alternatives, especially for performance-critical sections of your parser.

## Examples

Let's look at two examples to illustrate the concepts of backtracking and alternatives, and how to optimize parser performance.

### Example 1: Parser with Ambiguous Syntax

Consider a simple language where we have assignment statements and function calls, but both use parentheses. This can lead to ambiguity. Here's a parser that uses backtracking to handle this:

```typescript
import { Parser, InputStream, StringInputStream, ParseError } from './path-to-core-components';

type Statement = AssignmentStatement | FunctionCallStatement;

interface AssignmentStatement {
  type: 'assignment';
  variable: string;
  value: string;
}

interface FunctionCallStatement {
  type: 'functionCall';
  functionName: string;
  arguments: string[];
}

class AmbiguousParser extends Parser {
  constructor(input: InputStream) {
    super(input);
  }

  protected consumeTrivia(): string | undefined {
    return this.consumeWhile(char => /\s/.test(char));
  }

  protected consumeIdentifierForKeyword(): string | undefined {
    return this.consumeRegex(/[a-zA-Z]\w*/);
  }

  parse(): Statement {
    return this.parseStatement();
  }

  parseStatement(): Statement {
    return this.alternatives(
      () => this.parseAssignment(),
      () => this.parseFunctionCall()
    );
  }

  parseAssignment(): AssignmentStatement {
    const variable = this.must(this.consumeIdentifierForKeyword(), "Expected variable name");
    this.must(this.consumeString('('), "Expected '('");
    const value = this.must(this.consumeWhile(char => char !== ')'), "Expected value");
    this.must(this.consumeString(')'), "Expected ')'");
    this.must(this.consumeString('='), "Expected '='");
    return { type: 'assignment', variable, value };
  }

  parseFunctionCall(): FunctionCallStatement {
    const functionName = this.must(this.consumeIdentifierForKeyword(), "Expected function name");
    this.must(this.consumeString('('), "Expected '('");
    const args = this.parseArguments();
    this.must(this.consumeString(')'), "Expected ')'");
    return { type: 'functionCall', functionName, arguments: args };
  }

  parseArguments(): string[] {
    const args: string[] = [];
    while (!this.isEOFOrPeekChar(')')) {
      if (args.length > 0) {
        this.must(this.consumeString(','), "Expected ',' between arguments");
      }
      args.push(this.must(this.consumeWhile(char => char !== ',' && char !== ')'), "Expected argument"));
    }
    return args;
  }
}

// Usage
const testInputs = [
  "foo(bar)=",
  "foo(bar, baz)",
];

for (const input of testInputs) {
  try {
    const parser = new AmbiguousParser(new StringInputStream(input));
    const result = parser.parse();
    console.log(`Input: ${input}`);
    console.log(`Result: ${JSON.stringify(result, null, 2)}\n`);
  } catch (error) {
    if (error instanceof ParseError) {
      console.error(`Parse error for input "${input}":`, error.toString());
    } else {
      throw error;
    }
  }
}
```

In this example, the parser uses backtracking to differentiate between assignment statements and function calls. It first tries to parse an assignment, and if that fails, it backtracks and tries to parse a function call.

### Example 2: Optimized Parser with Lookahead

Now, let's optimize the previous parser by using lookahead to reduce the need for backtracking:

```typescript
class OptimizedParser extends Parser {
  // ... (previous code remains the same)

  parseStatement(): Statement {
    const identifier = this.must(this.consumeIdentifierForKeyword(), "Expected identifier");
    this.must(this.consumeString('('), "Expected '('");
    
    // Use lookahead to determine whether this is an assignment or a function call
    const isAssignment = this.isAssignment();
    
    if (isAssignment) {
      return this.parseAssignmentAfterOpenParen(identifier);
    } else {
      return this.parseFunctionCallAfterOpenParen(identifier);
    }
  }

  private isAssignment(): boolean {
    let depth = 1;
    let pos = this.getPosition();
    while (!this.isEOF()) {
      const char = this.consume();
      if (char === '(') depth++;
      if (char === ')') depth--;
      if (depth === 0) {
        const nextChar = this.peek();
        this.restorePosition(pos);
        return nextChar === '=';
      }
    }
    this.restorePosition(pos);
    return false;
  }

  private parseAssignmentAfterOpenParen(variable: string): AssignmentStatement {
    const value = this.must(this.consumeWhile(char => char !== ')'), "Expected value");
    this.must(this.consumeString(')'), "Expected ')'");
    this.must(this.consumeString('='), "Expected '='");
    return { type: 'assignment', variable, value };
  }

  private parseFunctionCallAfterOpenParen(functionName: string): FunctionCallStatement {
    const args = this.parseArguments();
    this.must(this.consumeString(')'), "Expected ')'");
    return { type: 'functionCall', functionName, arguments: args };
  }

  // ... (parseArguments method remains the same)
}
```

In this optimized version, we use a lookahead method (`isAssignment`) to check whether the statement is an assignment or a function call. This allows us to make a decision early on and avoid backtracking in most cases.

The `isAssignment` method scans ahead to find the matching closing parenthesis and checks if it's followed by an equals sign. It carefully manages the parser's position to ensure we don't consume any input during the lookahead.

This optimization can significantly improve performance, especially for longer inputs or in cases where the parser is used frequently.

These examples demonstrate how backtracking can be used to handle ambiguous syntax, and how lookahead can be employed to optimize parser performance by reducing the need for backtracking.

---

Previous: [Building Parsers](building-parsers.md) | Next: [Advanced Techniques](advanced-techniques.md)