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

export type ParseFailure = {
    message: string;
    position: number;
};
export type ParseResult = 'success' | ParseFailure;

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
    private debugEnabled: boolean;

    /**
     * Creates a new Parser instance.
     * @param input - The InputStream to wrap.
     * @param debug - Whether to enable debug logging (false by default).
     */
    constructor(
        protected input: InputStream,
        debug: boolean = false
    ) {
        this.debugEnabled = debug;
    }

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
     * Logs a debug message if debugging is enabled.
     * @param message - The message to log.
     * @private
     */
    private debugLog(message: string): void {
        if (this.debugEnabled) {
            const position = this.getPosition();
            const { line, column } = this.positionToLineAndColumn(position);
            console.log(
                `[DEBUG] [${line}:${column < 10 ? '0' : ''}${column}] ${this.indent < 10 ? ' ' : ''}${this.indent} ${'  '.repeat(this.indent)}${message}`
            );
        }
    }

    /**
     * Skips trivia if enabled and records the skipped trivia.
     * This method is called automatically before most input operations.
     * @private
     */
    private skipTriviaIfEnabled(): void {
        if (!this.skipTriviaEnabled) return;

        const originalDebugEnabled = this.debugEnabled;
        this.debugEnabled = false;
        while (true) {
            // This enables consumeTrivia to use its local InputStream
            this.skipTriviaEnabled = false;
            try {
                const kind = this.consumeTrivia();
                if (kind === undefined) break;
            } finally {
                this.skipTriviaEnabled = true;
            }
        }
        this.debugEnabled = originalDebugEnabled;
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
        this.debugLog(`Restored position to ${position}`);
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
        const eof = this.input.isEOF();
        this.debugLog(`Checked EOF: ${eof}`);
        return eof;
    }

    /**
     * @inheritdoc
     */
    peek(): string | undefined {
        this.skipTriviaIfEnabled();
        const peeked = this.input.peek();
        this.debugLog(
            `Peeked: ${peeked === undefined ? 'EOF' : `"${peeked}"`}`
        );
        return peeked;
    }

    mustBeEOF(): void {
        if (!this.isEOF()) {
            const remainingContent = this.input.peek();
            throw new ParseError(
                `Unexpected content parsing: "${remainingContent}${this.input.peek(1) ? '...' : ''}"`,
                this.getPosition(),
                this
            );
        }
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
        const result = this.isEOF() || this.input.peek() === str;
        this.debugLog(`Checked EOF or peek char "${str}": ${result}`);
        return result;
    }

    /**
     * Checks if the parser is at EOF or if the next character is one of the characters in the given string.
     *
     * @param str - A string containing all characters to check against the next input character.
     * @returns true if at EOF or if the next character is in the provided string, false otherwise.
     */
    isEOFOrPeekOneOf(str: string): boolean {
        this.skipTriviaIfEnabled();
        const result = this.isEOF() || str.includes(this.input.peek()!);
        this.debugLog(`Checked EOF or peek one of "${str}": ${result}`);
        return result;
    }

    /**
     * @inheritdoc
     */
    consume(count: number = 1): string | undefined {
        this.skipTriviaIfEnabled();
        const consumed = this.input.consume(count);
        if (consumed === undefined) {
            this.debugLog(`Failed to consume ${count} character(s)`);
        } else {
            this.debugLog(`Consumed ${count} character(s): "${consumed}"`);
        }
        return consumed;
    }

    /**
     * @inheritdoc
     */
    consumeString(str: string): string | undefined {
        this.skipTriviaIfEnabled();
        const consumed = this.input.consumeString(str);
        if (consumed === undefined) {
            this.debugLog(`Failed to consume string: "${str}"`);
        } else {
            this.debugLog(`Consumed string: "${consumed}"`);
        }
        return consumed;
    }

    /**
     * Attempts to consume a specific string and throws an error if unsuccessful.
     *
     * @param str - The string to consume.
     * @returns The consumed string.
     * @throws {ParseError} if the expected string cannot be consumed.
     */
    protected mustConsumeString(str: string): string {
        return this.must(this.consumeString(str), str);
    }

    protected consumeKeyword(keyword: string): string | undefined {
        const pos = this.getPosition();
        const consumed = this.consumeIdentifierForKeyword();
        if (consumed !== keyword) {
            this.restorePosition(pos);
            this.debugLog(`Failed to consume keyword: "${keyword}"`);
            return undefined;
        }
        this.debugLog(`Consumed keyword: "${keyword}"`);
        return keyword;
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
    consumeWhile(predicate: (char: string) => boolean): string | undefined {
        this.skipTriviaIfEnabled();
        const consumed = this.input.consumeWhile(predicate);
        if (consumed === undefined) {
            this.debugLog(`Failed to consume while predicate`);
        } else {
            this.debugLog(`Consumed while predicate: "${consumed}"`);
        }
        return consumed;
    }

    mustConsumeWhile(
        predicate: (char: string) => boolean,
        expected: string
    ): string {
        return this.must(this.consumeWhile(predicate), expected);
    }

    /**
     * @inheritdoc
     */
    consumeRegex(regex: RegExp): string | undefined {
        this.skipTriviaIfEnabled();
        const consumed = this.input.consumeRegex(regex);
        if (consumed === undefined) {
            this.debugLog(`Failed to consume regex: ${regex}`);
        } else {
            this.debugLog(`Consumed regex ${regex}: "${consumed}"`);
        }
        return consumed;
    }

    mustConsumeRegex(regex: RegExp, expected: string): string {
        return this.must(this.consumeRegex(regex), expected);
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
                const result = alternative();
                if (result !== undefined) {
                    this.debugLog(`First alternative succeeded: ${expected}`);
                    return result;
                }
            } catch (error) {
                if (error instanceof ParseError) {
                    errors.push(error);
                } else throw error;
            }
            this.restorePosition(pos);
        }
        const found = this.peek() ?? 'EOF';
        const error = new ParseError(
            `Expected "${expected}", but found "${found}"`,
            pos,
            this
        );
        error.children = errors;
        this.debugLog(`First alternative failed: ${expected}`);
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
                    this.debugLog(
                        `Zero or more ended with ${elements.length} elements`
                    );
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
                        this.debugLog(
                            `One or more ended with ${elements.length} elements`
                        );
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
            this.debugLog(
                `Must failed: Expected "${expected}", but found "${found}"`
            );
            throw new ParseError(
                `Expected "${expected}", but found "${found}"`,
                this.getPosition(),
                this
            );
        }
        this.debugLog(`Must succeeded: "${expected}"`);
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
            const result = parser();
            this.debugLog(`Maybe succeeded`);
            return result;
        } catch (error) {
            this.restorePosition(pos);
            if (error instanceof ParseError) {
                this.debugLog(`Maybe failed`);
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
    private indent = 0;
    protected withContext<T>(context: string, parser: () => T): T {
        const pos = this.getPosition();
        try {
            this.debugLog(
                `+ ${context} "${this.peek()}" ${this.getPosition()}`
            );
            this.indent++;
            const result = parser();
            this.indent--;
            this.debugLog(`- ${context}`);
            return result;
        } catch (error) {
            this.indent--;
            if (error instanceof ParseError) {
                this.debugLog(`x ${context}`);
                const newError = new ParseError(`«${context}»`, pos, this);
                newError.children = [error];
                throw newError;
            }
            throw error;
        }
    }
}
