# Advanced Techniques

This section covers advanced parsing techniques and optimizations that can help you build more sophisticated and efficient parsers using our custom parser infrastructure.

## Table of Contents

- [Advanced Techniques](#advanced-techniques)
  - [Table of Contents](#table-of-contents)
  - [Introduction](#introduction)
  - [Error Recovery Strategies](#error-recovery-strategies)
  - [Implementing Custom Input Streams](#implementing-custom-input-streams)
  - [Parsing Context-Sensitive Grammars](#parsing-context-sensitive-grammars)
  - [Optimizing Parser Performance](#optimizing-parser-performance)
  - [Handling Left-Recursion](#handling-left-recursion)
  - [Integrating External Tools or Libraries](#integrating-external-tools-or-libraries)
  - [Examples](#examples)
    - [1. Error Recovery Strategy](#1-error-recovery-strategy)
    - [2. Custom Input Stream](#2-custom-input-stream)
    - [3. Context-Sensitive Grammar Parsing](#3-context-sensitive-grammar-parsing)
    - [4. Performance Optimization](#4-performance-optimization)
    - [5. Handling Left-Recursion](#5-handling-left-recursion)
    - [6. Integrating External Libraries](#6-integrating-external-libraries)

## Introduction

As you become more proficient with our parser infrastructure, you may encounter more complex parsing scenarios that require advanced techniques. This section will introduce you to these techniques and provide guidance on when and how to use them.

## Error Recovery Strategies

Error recovery is crucial for creating user-friendly parsers, especially for interactive environments like IDEs. Here are some common error recovery strategies:

1. Panic Mode Recovery: Skip input until a synchronization token is found.
2. Phrase-Level Recovery: Attempt to make minimal changes to the input to create a valid parse.
3. Error Productions: Include common errors as part of your grammar.

## Implementing Custom Input Streams

Custom input streams can be useful for parsing from various sources or implementing specialized behavior. To create a custom input stream, implement the `InputStream` interface.

## Parsing Context-Sensitive Grammars

Context-sensitive parsing often requires maintaining state during the parse. This can be achieved by:

1. Passing context objects through your parsing methods.
2. Using a symbol table to track declarations and scopes.
3. Implementing multi-pass parsing for languages that require it.

## Optimizing Parser Performance

Performance optimization techniques include:

1. Memoization: Cache the results of parsing functions to avoid re-parsing.
2. Lazy Parsing: Only parse what's necessary, deferring the rest.
3. Stream Optimizations: Implement efficient lookahead and backtracking.

## Handling Left-Recursion

Left-recursion can be handled by:

1. Rewriting the grammar to eliminate left-recursion.
2. Using the Pratt parsing algorithm for expression parsing.
3. Implementing a generalized left-recursion algorithm.

## Integrating External Tools or Libraries

External tools or libraries can be integrated by:

1. Wrapping external functionality in your parser methods.
2. Using external libraries for lexing or specific parsing tasks.
3. Generating parser code from external grammar definitions.

## Examples

### 1. Error Recovery Strategy

Here's an example of implementing a simple panic mode recovery:

```typescript
class RecoveringParser extends Parser {
  // ... other methods ...

  parseStatement(): StatementNode {
    try {
      // Attempt to parse a statement
      return this.parseNormalStatement();
    } catch (error) {
      if (error instanceof ParseError) {
        console.error("Error encountered:", error.message);
        this.recoverToNextStatement();
        return { type: 'error', message: error.message };
      }
      throw error;
    }
  }

  private recoverToNextStatement() {
    while (!this.isEOF() && !this.isEOFOrPeekChar(';')) {
      this.consume();
    }
    if (!this.isEOF()) {
      this.consume(); // Consume the semicolon
    }
  }
}
```

### 2. Custom Input Stream

Here's an example of a custom input stream that reads from a file:

```typescript
import * as fs from 'fs';
import { InputStream, LineAndColumn } from './path-to-core-components';

class FileInputStream implements InputStream {
  private content: string;
  private position: number = 0;

  constructor(filePath: string) {
    this.content = fs.readFileSync(filePath, 'utf8');
  }

  getPosition(): number {
    return this.position;
  }

  restorePosition(position: number): void {
    this.position = position;
  }

  positionToLineAndColumn(position: number): LineAndColumn {
    const lines = this.content.slice(0, position).split('\n');
    return {
      line: lines.length,
      column: lines[lines.length - 1].length + 1
    };
  }

  isEOF(): boolean {
    return this.position >= this.content.length;
  }

  peek(lookAhead: number = 0): string | undefined {
    return this.content[this.position + lookAhead];
  }

  consume(count: number = 1): string | undefined {
    const result = this.content.slice(this.position, this.position + count);
    this.position += count;
    return result.length > 0 ? result : undefined;
  }

  // ... implement other InputStream methods ...
}
```

### 3. Context-Sensitive Grammar Parsing

Here's an example of parsing a simple context-sensitive language where variables must be declared before use:

```typescript
class ContextSensitiveParser extends Parser {
  private declaredVariables: Set<string> = new Set();

  // ... other methods ...

  parseStatement(): StatementNode {
    return this.alternatives(
      () => this.parseDeclaration(),
      () => this.parseAssignment()
    );
  }

  parseDeclaration(): DeclarationNode {
    this.mustConsumeKeyword('var');
    const name = this.must(this.consumeIdentifierForKeyword(), "Expected variable name");
    this.declaredVariables.add(name);
    return { type: 'declaration', name };
  }

  parseAssignment(): AssignmentNode {
    const name = this.must(this.consumeIdentifierForKeyword(), "Expected variable name");
    if (!this.declaredVariables.has(name)) {
      throw new ParseError(`Variable ${name} used before declaration`, this.getPosition(), this);
    }
    this.mustConsume('=');
    const value = this.parseExpression();
    return { type: 'assignment', name, value };
  }

  // ... other methods ...
}
```

### 4. Performance Optimization

Here's an example of using memoization to optimize a recursive parser:

```typescript
class MemoizedParser extends Parser {
  private memo: Map<string, Map<number, any>> = new Map();

  memoize<T>(key: string, parser: () => T): T {
    const position = this.getPosition();
    if (!this.memo.has(key)) {
      this.memo.set(key, new Map());
    }
    const memoForKey = this.memo.get(key)!;
    if (memoForKey.has(position)) {
      const [result, endPosition] = memoForKey.get(position);
      this.restorePosition(endPosition);
      return result;
    }
    const result = parser();
    memoForKey.set(position, [result, this.getPosition()]);
    return result;
  }

  parseExpression(): ExpressionNode {
    return this.memoize('expression', () => {
      // ... complex expression parsing logic ...
    });
  }

  // ... other methods ...
}
```

### 5. Handling Left-Recursion

Here's an example of handling left-recursion for arithmetic expressions using the Pratt parsing algorithm:

```typescript
class PrattParser extends Parser {
  private precedence: { [key: string]: number } = {
    '+': 1,
    '-': 1,
    '*': 2,
    '/': 2,
  };

  parseExpression(minPrecedence: number = 0): ExpressionNode {
    let left = this.parsePrimary();

    while (true) {
      const operator = this.peek();
      if (!operator || !this.precedence[operator] || this.precedence[operator] < minPrecedence) {
        break;
      }

      this.consume();
      const newMinPrecedence = this.precedence[operator] + 1;
      const right = this.parseExpression(newMinPrecedence);

      left = { type: 'binaryOp', operator, left, right };
    }

    return left;
  }

  parsePrimary(): ExpressionNode {
    return this.alternatives(
      () => this.parseNumber(),
      () => this.parseParenthesizedExpression()
    );
  }

  // ... other methods ...
}
```

### 6. Integrating External Libraries

Here's an example of integrating an external lexer library (using a hypothetical `ExternalLexer` as an example):

```typescript
import { ExternalLexer, Token } from 'external-lexer-library';

class ExternalLexerInputStream implements InputStream {
  private lexer: ExternalLexer;
  private tokens: Token[];
  private position: number = 0;

  constructor(input: string) {
    this.lexer = new ExternalLexer(input);
    this.tokens = this.lexer.tokenize();
  }

  getPosition(): number {
    return this.position;
  }

  restorePosition(position: number): void {
    this.position = position;
  }

  isEOF(): boolean {
    return this.position >= this.tokens.length;
  }

  peek(): Token | undefined {
    return this.tokens[this.position];
  }

  consume(): Token | undefined {
    return this.tokens[this.position++];
  }

  // ... implement other InputStream methods ...
}

class ExternalLexerParser extends Parser {
  constructor(input: string) {
    super(new ExternalLexerInputStream(input));
  }

  // Use tokens instead of characters in your parsing methods
  parseExpression(): ExpressionNode {
    const token = this.consume() as Token;
    switch (token.type) {
      case 'number':
        return { type: 'number', value: parseFloat(token.value) };
      case 'identifier':
        return { type: 'variable', name: token.value };
      // ... handle other token types ...
    }
  }

  // ... other parsing methods ...
}
```

These examples demonstrate how to implement various advanced techniques in your parsers. Each technique addresses a specific challenge in parsing, from error handling to performance optimization and handling complex grammar structures.

---

Previous: [Backtracking and Alternatives](backtracking-and-alternatives.md) | [Back to README](README.md)