/**
 * @file parser.ts
 * @description Core parsing infrastructure for a custom parser implementation.
 *
 * This file provides the foundation for building specific parsers with built-in
 * trivia handling and error management. It defines the abstract Parser class,
 * which implements the InputStream interface and adds automatic trivia skipping
 * functionality.
 */

import { InputStream, LineAndColumn } from './inputStream';
import { ParseError } from './parseError';

/**
 * Represents a piece of skipped trivia in the input stream.
 * Trivia typically includes whitespace, comments, or other ignored content.
 */
interface Trivia {
    /** The kind of trivia (e.g., "whitespace", "comment") */
    kind: string;
    /** The starting position of the trivia in the input */
    start: number;
    /** The ending position of the trivia in the input */
    end: number;
}

/**
 * An abstract base Parser class that implements InputStream and adds automatic trivia skipping functionality.
 * This class serves as a foundation for building specific parsers with built-in trivia handling.
 *
 * @implements {InputStream}
 */
export abstract class Parser implements InputStream {
    /** Whether to skip trivia or not (true by default) */
    private skipTriviaEnabled: boolean = true;

    /**
     * Creates a new Parser instance.
     * @param input - The InputStream to wrap.
     */
    constructor(protected input: InputStream) {}

    /**
     * Abstract method to skip trivia. Must be implemented by subclasses.
     * This method defines how trivia is identified and skipped in the input.
     * @returns The kind of trivia skipped, or undefined if no trivia was skipped.
     */
    protected abstract consumeTrivia(): string | undefined;

    /**
     * Abstract method to consume an identifier for a keyword.
     * Must be implemented by subclasses.
     * @returns The consumed identifier, or undefined if no identifier was consumed.
     */
    protected abstract consumeIdentifierForKeyword(): string | undefined;

    /**
     * Skips trivia if enabled and records the skipped trivia.
     * This method is called automatically before most input operations.
     * @private
     */
    private skipTriviaIfEnabled(): void {
        if (!this.skipTriviaEnabled) return;

        while (true) {
            // This enables consumeTrivia to use its local InputStream
            this.skipTriviaEnabled = false;
            try {
                const kind = this.consumeTrivia();
                if (kind === undefined) return;
            } finally {
                this.skipTriviaEnabled = true;
            }
        }
    }

    /**
     * Temporarily disables trivia skipping, executes a consumer function, then restores trivia skipping.
     * Useful for parsing sections where trivia should be treated as significant.
     *
     * @param consumer - The consumer function to execute without trivia skipping.
     * @returns The result of the executed consumer function.
     */
    ignoreTriviaDuring<T>(consumer: () => T): T {
        this.skipTriviaIfEnabled();
        const originalSkipTrivia = this.skipTriviaEnabled;
        this.skipTriviaEnabled = false;
        try {
            return consumer();
        } finally {
            this.skipTriviaEnabled = originalSkipTrivia;
        }
    }

    // InputStream interface methods

    /**
     * @inheritdoc
     */
    getPosition(): number {
        return this.input.getPosition();
    }

    /**
     * @inheritdoc
     * @throws Error if attempting to restore to a future position.
     */
    restorePosition(position: number): void {
        if (position > this.input.getPosition())
            throw new Error('Cannot restore to a future position');
        this.input.restorePosition(position);
    }

    /**
     * @inheritdoc
     */
    positionToLineAndColumn(position: number): LineAndColumn {
        return this.input.positionToLineAndColumn(position);
    }

    /**
     * @inheritdoc
     */
    isEOF(): boolean {
        this.skipTriviaIfEnabled();
        return this.input.isEOF();
    }

    /**
     * @inheritdoc
     */
    peek(): string | undefined {
        this.skipTriviaIfEnabled();
        return this.input.peek();
    }

    /**
     * Peeks at the next character in the input stream and ensures it's not EOF.
     *
     * @param expected - A description of the expected character or token, used in the error message.
     * @returns The next character in the input stream.
     * @throws {ParseError} if the next character is EOF.
     */
    mustPeek(expected: string): string {
        const c = this.peek();
        if (!c)
            throw new ParseError(
                `Expected ${expected}, but found EOF"`,
                this.getPosition(),
                this
            );
        return c;
    }

    /**
     * Checks if the parser is at EOF or if the next character matches the given string.
     *
     * @param str - A single-character string to check against the next input character.
     * @returns true if at EOF or if the next character matches str, false otherwise.
     * @throws {Error} if str is not a single-character string.
     */
    isEOFOrPeekChar(str: string): boolean {
        if (str.length > 1)
            throw new Error(
                'notEOFAndCannotPeekChar only accepts single-character strings'
            );
        this.skipTriviaIfEnabled();
        return this.isEOF() || this.input.peek() === str;
    }

    /**
     * Checks if the parser is at EOF or if the next character is one of the characters in the given string.
     *
     * @param str - A string containing all characters to check against the next input character.
     * @returns true if at EOF or if the next character is in the provided string, false otherwise.
     */
    isEOFOrPeekOneOf(str: string): boolean {
        this.skipTriviaIfEnabled();
        return this.isEOF() || str.includes(this.input.peek()!);
    }

    /**
     * @inheritdoc
     */
    consume(count: number = 1): string | undefined {
        this.skipTriviaIfEnabled();
        return this.input.consume(count);
    }

    protected consumeKeyword(keyword: string): string | undefined {
        const pos = this.getPosition();
        const consumed = this.consumeIdentifierForKeyword();
        if (consumed === undefined || consumed !== keyword) {
            this.restorePosition(pos);
            return undefined;
        }
        return consumed;
    }
    /**
     * Attempts to consume a keyword and throws an error if unsuccessful.
     *
     * @param keyword - The keyword to consume.
     * @returns The consumed keyword.
     * @throws {ParseError} if the expected keyword cannot be consumed.
     */
    protected mustConsumeKeyword(keyword: string): string {
        return this.must(this.consumeKeyword(keyword), keyword);
    }

    /**
     * @inheritdoc
     */
    consumeRegex(regex: RegExp): string | undefined {
        this.skipTriviaIfEnabled();
        return this.input.consumeRegex(regex);
    }

    mustConsumeRegex(regex: RegExp, expected: string): string {
        return this.must(this.consumeRegex(regex), expected);
    }

    /**
     * @inheritdoc
     */
    consumeString(str: string): string | undefined {
        this.skipTriviaIfEnabled();
        return this.input.consumeString(str);
    }

    /**
     * Attempts to consume a specific string and throws an error if unsuccessful.
     *
     * @param str - The string to consume.
     * @returns The consumed string.
     * @throws {ParseError} if the expected string cannot be consumed.
     */
    protected mustConsumeString(str: string): string {
        return this.consumeString(str), str;
    }

    /**
     * @inheritdoc
     */
    consumeWhile(predicate: (char: string) => boolean): string | undefined {
        this.skipTriviaIfEnabled();
        return this.input.consumeWhile(predicate);
    }

    mustConsumeWhile(
        predicate: (char: string) => boolean,
        expected: string
    ): string {
        return this.must(this.consumeWhile(predicate), expected);
    }

    /**
     * Attempts to parse using multiple alternative parsers.
     *
     * @param alternatives - An array of parser functions to try.
     * @returns The result of the first successful parser.
     * @throws {ParseError} if all alternatives fail.
     */
    protected firstAlternative<T extends any[]>(
        expected: string,
        ...alternatives: { [K in keyof T]: () => T[K] }
    ): T[number] {
        const pos = this.getPosition();
        const errors: ParseError[] = [];
        for (const alternative of alternatives) {
            try {
                return alternative();
            } catch (error) {
                if (error instanceof ParseError) {
                    errors.push(error);
                } else throw error;
            }
        }
        const found = this.peek() ?? 'EOF';
        const error = new ParseError(
            `Expected "${expected}", but found "${found}"`,
            this.getPosition(),
            this
        );
        error.children = errors;
        throw error;
    }

    /**
     * Parses zero or more occurrences of a pattern.
     *
     * @param parser - A function that parses a single occurrence of the pattern.
     * @returns An array of parsed elements.
     */
    protected zeroOrMore<T>(parser: () => T): T[] {
        const elements: T[] = [];

        while (true) {
            let pos = this.getPosition();
            try {
                elements.push(parser());
                pos = this.getPosition();
            } catch (error) {
                this.restorePosition(pos);
                if (error instanceof ParseError) {
                    return elements;
                }
                throw error;
            }
        }
    }

    /**
     * Parses one or more occurrences of a pattern.
     *
     * @param parser - A function that parses a single occurrence of the pattern.
     * @returns An array of parsed elements.
     * @throws {ParseError} if no occurrences are found.
     */
    protected oneOrMore<T>(parser: () => T): T[] {
        const elements: T[] = [];

        while (true) {
            let pos = this.getPosition();
            try {
                elements.push(parser());
                pos = this.getPosition();
            } catch (error) {
                this.restorePosition(pos);
                if (error instanceof ParseError) {
                    if (elements.length > 0) {
                        return elements;
                    }
                }
                throw error;
            }
        }
    }

    /**
     * Helper method to assert that a value is defined.
     *
     * @param value - The value to check.
     * @param errorMessage - The error message to use if the value is undefined.
     * @returns The value if it is defined.
     * @throws {ParseError} if the value is undefined.
     */
    protected must<T>(value: T | undefined, expected: string): T {
        if (value === undefined) {
            const found = this.peek() ?? 'EOF';
            throw new ParseError(
                `Expected "${expected}", but found "${found}"`,
                this.getPosition(),
                this
            );
        }
        return value;
    }

    /**
     * Helper method to attempt a parsing operation, returning undefined if it fails.
     * Useful for implementing optional grammar rules.
     *
     * @param parser - A function that performs a parsing operation.
     * @returns The result of the parsing operation, or undefined if it fails.
     */
    protected maybe<T>(parser: () => T): T | undefined {
        const pos = this.getPosition();
        try {
            return parser();
        } catch (error) {
            this.restorePosition(pos);
            if (error instanceof ParseError) {
                return undefined;
            }
            throw error;
        }
    }

    /**
     * Wraps a parsing operation with context information for better error reporting.
     *
     * @param context - A string describing the context of the parsing operation.
     * @param parser - A function that performs a parsing operation.
     * @returns The result of the parsing operation.
     * @throws {ParseError} with added context information if the parsing operation fails.
     */
    protected withContext<T>(context: string, parser: () => T): T {
        const pos = this.getPosition();
        try {
            return parser();
        } catch (error) {
            if (error instanceof ParseError) {
                const newError = new ParseError(`«${context}»`, pos, this);
                newError.children = [error];
                throw newError;
            }
            throw error;
        }
    }
}
