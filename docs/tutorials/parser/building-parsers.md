# Building Parsers

This section will guide you through the process of building parsers using the core components we discussed in the previous section. You'll learn how to create custom parsers, implement grammar rules, and handle various parsing scenarios.

## Table of Contents

- [Building Parsers](#building-parsers)
  - [Table of Contents](#table-of-contents)
  - [Introduction to Building Parsers](#introduction-to-building-parsers)
  - [Creating a Custom Parser](#creating-a-custom-parser)
  - [Implementing Required Methods](#implementing-required-methods)
  - [Defining Grammar Rules](#defining-grammar-rules)
  - [Handling Alternatives and Repetition](#handling-alternatives-and-repetition)
  - [Error Handling and Reporting](#error-handling-and-reporting)
  - [Complete Parser Example](#complete-parser-example)

## Introduction to Building Parsers

Building a parser involves creating a structured representation of text input according to a set of grammar rules. With our parser infrastructure, you can create parsers that are both powerful and flexible, capable of handling complex language structures while providing robust error reporting.

## Creating a Custom Parser

To create a custom parser, you'll need to extend the abstract `Parser` class. Here's a basic structure:

```typescript
import { Parser, InputStream } from './path-to-core-components';

class MyCustomParser extends Parser {
  constructor(input: InputStream) {
    super(input);
  }

  // Implement required methods and grammar rules here
}
```

## Implementing Required Methods

The `Parser` class requires you to implement two abstract methods:

1. `consumeTrivia()`: Defines how to skip over insignificant parts of the input (like whitespace or comments).
2. `consumeIdentifierForKeyword()`: Defines how to consume an identifier that could be a keyword.

Here's an example implementation:

```typescript
protected consumeTrivia(): string | undefined {
  return this.consumeWhile(char => /\s/.test(char));
}

protected consumeIdentifierForKeyword(): string | undefined {
  return this.consumeRegex(/[a-zA-Z]\w*/);
}
```

## Defining Grammar Rules

Grammar rules are implemented as methods in your parser class. Each method typically corresponds to a non-terminal in your grammar. For example:

```typescript
parseExpression(): ExpressionNode {
  return this.alternatives(
    () => this.parseNumber(),
    () => this.parseIdentifier(),
    () => this.parseParenthesizedExpression()
  );
}

parseNumber(): NumberNode {
  const numberStr = this.must(this.consumeRegex(/\d+(\.\d+)?/), "Expected number");
  return { type: 'number', value: parseFloat(numberStr) };
}

// Implement other parsing methods...
```

## Handling Alternatives and Repetition

The `Parser` class provides methods to handle common parsing patterns:

- `alternatives()`: For handling multiple possible productions.
- `zeroOrMore()`: For parsing zero or more occurrences of a pattern.
- `oneOrMore()`: For parsing one or more occurrences of a pattern.

Example:

```typescript
parseStatements(): StatementNode[] {
  return this.zeroOrMore(() => this.parseStatement());
}
```

## Error Handling and Reporting

Use the `ParseError` class and the `must()` method for error handling:

```typescript
parseKeyword(keyword: string): string {
  return this.must(
    this.consumeString(keyword),
    `Expected keyword "${keyword}"`
  );
}
```

## Complete Parser Example

Let's create a simple arithmetic expression parser that can handle addition, subtraction, multiplication, division, and parentheses. This example will demonstrate how to use all the concepts we've discussed.

```typescript
import { Parser, InputStream, StringInputStream, ParseError } from './path-to-core-components';

// Define the AST node types
type ExpressionNode = NumberNode | BinaryOpNode;

interface NumberNode {
  type: 'number';
  value: number;
}

interface BinaryOpNode {
  type: 'binaryOp';
  operator: '+' | '-' | '*' | '/';
  left: ExpressionNode;
  right: ExpressionNode;
}

class ArithmeticParser extends Parser {
  constructor(input: InputStream) {
    super(input);
  }

  protected consumeTrivia(): string | undefined {
    return this.consumeWhile(char => /\s/.test(char));
  }

  protected consumeIdentifierForKeyword(): string | undefined {
    // This parser doesn't use keywords, so we can return undefined
    return undefined;
  }

  parse(): ExpressionNode {
    const result = this.parseExpression();
    this.must(this.isEOF(), "Expected end of input");
    return result;
  }

  parseExpression(): ExpressionNode {
    return this.parseAdditiveExpression();
  }

  parseAdditiveExpression(): ExpressionNode {
    let left = this.parseMultiplicativeExpression();
    while (true) {
      const operator = this.consumeString('+') || this.consumeString('-');
      if (!operator) break;
      const right = this.parseMultiplicativeExpression();
      left = { type: 'binaryOp', operator: operator as '+' | '-', left, right };
    }
    return left;
  }

  parseMultiplicativeExpression(): ExpressionNode {
    let left = this.parsePrimaryExpression();
    while (true) {
      const operator = this.consumeString('*') || this.consumeString('/');
      if (!operator) break;
      const right = this.parsePrimaryExpression();
      left = { type: 'binaryOp', operator: operator as '*' | '/', left, right };
    }
    return left;
  }

  parsePrimaryExpression(): ExpressionNode {
    return this.alternatives(
      () => this.parseNumber(),
      () => this.parseParenthesizedExpression()
    );
  }

  parseNumber(): NumberNode {
    const numberStr = this.must(this.consumeRegex(/\d+(\.\d+)?/), "Expected number");
    return { type: 'number', value: parseFloat(numberStr) };
  }

  parseParenthesizedExpression(): ExpressionNode {
    this.must(this.consumeString('('), "Expected '('");
    const expression = this.parseExpression();
    this.must(this.consumeString(')'), "Expected ')'");
    return expression;
  }
}

// Usage example
try {
  const input = new StringInputStream("3 + 4 * (2 - 1)");
  const parser = new ArithmeticParser(input);
  const result = parser.parse();
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  if (error instanceof ParseError) {
    console.error("Parse error:", error.toString());
  } else {
    throw error;
  }
}
```

This example demonstrates:

1. Extending the `Parser` class to create a custom `ArithmeticParser`.
2. Implementing the required `consumeTrivia` and `consumeIdentifierForKeyword` methods.
3. Defining grammar rules for expressions, including handling operator precedence.
4. Using `alternatives` for parsing primary expressions (numbers or parenthesized expressions).
5. Implementing error handling with `must` and `ParseError`.
6. Using the parser to parse an arithmetic expression and handle potential errors.

The parser follows this grammar:

```
expression = additive-expression
additive-expression = multiplicative-expression (('+' | '-') multiplicative-expression)*
multiplicative-expression = primary-expression (('*' | '/') primary-expression)*
primary-expression = number | '(' expression ')'
number = /\d+(\.\d+)?/
```

This example showcases how to build a parser for a simple language using the provided parser infrastructure. It demonstrates handling of operator precedence, parentheses for grouping, and basic error reporting.

---

Previous: [Core Components](core-components.md) | Next: [Backtracking and Alternatives](backtracking-and-alternatives.md)