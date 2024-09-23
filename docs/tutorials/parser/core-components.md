# Core Components

This section covers the core components of our custom parser infrastructure: `InputStream`, `StringInputStream`, `Parser`, and `ParseError`. These components work together to provide a flexible and powerful foundation for building parsers.

## InputStream

The `InputStream` interface defines the contract for input stream classes, providing methods for reading and manipulating input. This interface allows for flexibility in how input is sourced and processed.

### Key Methods

- `getPosition()`: Returns the current position in the input.
- `restorePosition(position: number)`: Restores the stream to a previously saved position, crucial for implementing backtracking.
- `positionToLineAndColumn(position: number)`: Converts a position to line and column information, useful for generating human-readable error messages.
- `isEOF()`: Checks if the end of the input has been reached.
- `peek(lookAhead?: number)`: Attempts to peek at upcoming characters without consuming them, essential for lookahead operations.
- `consume(count?: number)`: Attempts to consume the specified number of characters from the input.
- `consumeRegex(regex: RegExp)`: Attempts to consume input matching a regular expression at the current position.
- `consumeString(str: string)`: Attempts to consume a specific string at the current position.
- `consumeWhile(predicate: (char: string) => boolean)`: Attempts to consume characters while the predicate function returns true.

These methods provide a comprehensive set of tools for navigating and consuming input, allowing for both simple and complex parsing operations.

## StringInputStream

The `StringInputStream` class implements the `InputStream` interface, providing methods for reading and manipulating string-based input. This class is designed to work efficiently with string content, making it ideal for parsing text-based inputs.

### Key Features

- Implements all methods defined in the `InputStream` interface.
- Manages an internal position pointer to keep track of the current location in the input string.
- Provides efficient string manipulation and matching operations.

### Important Methods

- `constructor(input: string)`: Initializes the StringInputStream with the input string.

## Parser

The `Parser` class is an abstract base class that implements the `InputStream` interface and adds automatic trivia skipping functionality. It serves as a foundation for building specific parsers with built-in trivia handling and error management.

### Key Features

- Implements the `InputStream` interface, wrapping an underlying input stream.
- Provides automatic trivia skipping (e.g., whitespace, comments) before most input operations.
- Offers methods for handling alternatives, repetition, and optional parsing operations.
- Includes error handling and context management for better error reporting.

### Important Methods

- `constructor(input: InputStream)`: Initializes the Parser with an input stream.
- `protected abstract consumeTrivia()`: Must be implemented by subclasses to define how trivia is identified and skipped.
- `protected abstract consumeIdentifierForKeyword()`: Must be implemented by subclasses to define how identifiers for keywords are consumed.
- `ignoreTriviaDuring<T>(consumer: () => T)`: Temporarily disables trivia skipping for parsing sections where trivia is significant.
- `mustPeek(description: string)`: Peeks at the next character and ensures it's not EOF.
- `isEOFOrPeekChar(str: string)`: Checks if the parser is at EOF or if the next character matches the given string.
- `isEOFOrPeekOneOf(str: string)`: Checks if the parser is at EOF or if the next character is one of the characters in the given string.
- `protected mustConsume(str: string)`: Attempts to consume a specific string and throws an error if unsuccessful.
- `protected mustConsumeKeyword(keyword: string)`: Attempts to consume a keyword and throws an error if unsuccessful.
- `protected alternatives<T>(...alternatives: (() => T)[])`: Attempts to parse using multiple alternative parsers.
- `protected zeroOrMore<T>(parser: () => T)`: Parses zero or more occurrences of a pattern.
- `protected oneOrMore<T>(parser: () => T)`: Parses one or more occurrences of a pattern.
- `protected must<T>(value: T | undefined, errorMessage: string)`: Asserts that a value is defined.
- `protected maybe<T>(parser: () => T)`: Attempts a parsing operation, returning undefined if it fails.
- `protected withContext<T>(context: string, parser: () => T)`: Wraps a parsing operation with context information for better error reporting.

The `Parser` class provides a powerful set of tools for building complex parsers with built-in error handling, trivia management, and support for common parsing patterns like alternatives and repetition.

## ParseError

The `ParseError` class is a custom error class designed for handling parsing errors with detailed position information. It extends the standard JavaScript `Error` class and provides additional functionality for creating structured error trees.

### Key Features

- Extends the standard `Error` class.
- Stores the position in the input where the error occurred.
- Maintains a reference to the `InputStream` instance associated with the error.
- Supports a tree structure for nested errors through the `children` property.
- Provides a detailed string representation of the error tree.

### Important Properties and Methods

- `constructor(message: string, position: number, input: InputStream)`: Creates a new ParseError instance with the given message, position, and input stream.
- `children?: ParseError[]`: Optional array of child ParseError instances, allowing for a tree structure of errors.
- `toString(): string`: Converts the ParseError tree to a human-readable string representation.

### Error Tree Representation

The `ParseError` class provides a sophisticated way to represent nested parsing errors. When you call `toString()` on a ParseError instance, it generates an indented, tree-like structure that shows the hierarchy of errors. This is particularly useful for complex parsing scenarios where errors can occur at multiple levels of the parsing process.

For example, an error tree might look like this:

```
Expected expression at 1:10
├─Expected number at 1:10
│ └─Expected digit at 1:10
└─Expected operator at 1:10
  └─Expected '+' or '-' at 1:10
```

This tree structure allows for more detailed and context-aware error reporting, which can significantly aid in debugging and understanding parsing issues.

The `ParseError` class is an essential component of the error handling system in this parser infrastructure, providing detailed and structured information about parsing errors.

---

Previous: [README](README.md) | Next: [Building Parsers](building-parsers.md)