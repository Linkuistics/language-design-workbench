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

export type ParseFailure = {
    message: string;
    position: number;
    children?: ParseFailure[];
};
export type ParseResult<T> = { success: true; value: T } | { success: false; failure: ParseFailure };

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
    ignoreTriviaDuring<T>(consumer: () => ParseResult<T>): ParseResult<T> {
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
        if (position > this.input.getPosition()) throw new Error('Cannot restore to a future position');
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
        this.debugLog(`Peeked: ${peeked === undefined ? 'EOF' : `"${peeked}"`}`);
        return peeked;
    }

    mustBeEOF(): ParseResult<void> {
        if (!this.isEOF()) {
            const remainingContent = this.input.peek();
            return this.failure(`Unexpected content parsing: "${remainingContent}${this.input.peek(1) ? '...' : ''}"`);
        }
        return this.success(undefined);
    }

    /**
     * Peeks at the next character in the input stream and ensures it's not EOF.
     *
     * @param expected - A description of the expected character or token, used in the error message.
     * @returns A ParseResult containing the next character in the input stream or a failure.
     */
    mustPeek(expected: string): ParseResult<string> {
        const c = this.peek();
        if (!c) {
            return this.failure(`Expected ${expected}, but found EOF`);
        }
        return this.success(c);
    }

    /**
     * Checks if the parser is at EOF or if the next character matches the given string.
     *
     * @param str - A single-character string to check against the next input character.
     * @returns true if at EOF or if the next character matches str, false otherwise.
     * @throws {Error} if str is not a single-character string.
     */
    isEOFOrPeekChar(str: string): boolean {
        if (str.length > 1) throw new Error('notEOFAndCannotPeekChar only accepts single-character strings');
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
     * Attempts to consume a specific string and returns a ParseResult.
     *
     * @param str - The string to consume.
     * @returns A ParseResult containing the consumed string or a failure.
     */
    protected mustConsumeString(str: string): ParseResult<string> {
        const consumed = this.consumeString(str);
        if (consumed === undefined) {
            return this.failure(`Expected "${str}", but found "${this.peek() ?? 'EOF'}"`);
        }
        return this.success(consumed);
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
     * Attempts to consume a keyword and returns a ParseResult.
     *
     * @param keyword - The keyword to consume.
     * @returns A ParseResult containing the consumed keyword or a failure.
     */
    protected mustConsumeKeyword(keyword: string): ParseResult<string> {
        const consumed = this.consumeKeyword(keyword);
        if (consumed === undefined) {
            return this.failure(`Expected keyword "${keyword}", but found "${this.peek() ?? 'EOF'}"`);
        }
        return this.success(consumed);
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

    mustConsumeWhile(predicate: (char: string) => boolean, expected: string): ParseResult<string> {
        const consumed = this.consumeWhile(predicate);
        if (consumed === undefined) {
            return this.failure(`Expected ${expected}, but found "${this.peek() ?? 'EOF'}"`);
        }
        return this.success(consumed);
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

    mustConsumeRegex(regex: RegExp, expected: string): ParseResult<string> {
        const consumed = this.consumeRegex(regex);
        if (consumed === undefined) {
            return this.failure(`Expected ${expected}, but found "${this.peek() ?? 'EOF'}"`);
        }
        return this.success(consumed);
    }

    /**
     * Attempts to parse using multiple alternative parsers.
     *
     * @param alternatives - An array of parser functions to try.
     * @returns A ParseResult containing the result of the first successful parser or a failure.
     */
    protected firstAlternative<T extends any[]>(
        expected: string,
        ...alternatives: { [K in keyof T]: () => ParseResult<T[K]> }
    ): ParseResult<T[number]> {
        const pos = this.getPosition();
        const errors: ParseFailure[] = [];
        for (const alternative of alternatives) {
            const result = alternative();
            if (result.success) {
                this.debugLog(`First alternative succeeded: ${expected}`);
                return result;
            }
            errors.push(result.failure);
            this.restorePosition(pos);
        }
        const found = this.peek() ?? 'EOF';
        this.debugLog(`First alternative failed: ${expected}`);
        return {
            success: false,
            failure: {
                message: `Expected "${expected}", but found "${found}"`,
                position: pos,
                children: errors
            }
        };
    }

    /**
     * Parses zero or more occurrences of a pattern.
     *
     * @param parser - A function that parses a single occurrence of the pattern.
     * @returns A ParseResult containing an array of parsed elements.
     */
    protected zeroOrMore<T>(parser: () => ParseResult<T>): ParseResult<T[]> {
        const elements: T[] = [];
        while (true) {
            const pos = this.getPosition();
            const result = parser();
            if (result.success) {
                elements.push(result.value);
            } else {
                this.restorePosition(pos);
                this.debugLog(`Zero or more ended with ${elements.length} elements`);
                return this.success(elements);
            }
        }
    }

    /**
     * Parses one or more occurrences of a pattern.
     *
     * @param parser - A function that parses a single occurrence of the pattern.
     * @returns A ParseResult containing an array of parsed elements or a failure.
     */
    protected oneOrMore<T>(parser: () => ParseResult<T>): ParseResult<T[]> {
        const elements: T[] = [];
        while (true) {
            const pos = this.getPosition();
            const result = parser();
            if (result.success) {
                elements.push(result.value);
            } else {
                this.restorePosition(pos);
                if (elements.length > 0) {
                    this.debugLog(`One or more ended with ${elements.length} elements`);
                    return this.success(elements);
                }
                return result;
            }
        }
    }

    /**
     * Helper method to assert that a value is defined.
     *
     * @param value - The value to check.
     * @param expected - The expected value description.
     * @returns A ParseResult containing the value if it is defined, or a failure.
     */
    protected must<T>(value: T | undefined, expected: string): ParseResult<T> {
        if (value === undefined) {
            const found = this.peek() ?? 'EOF';
            this.debugLog(`Must failed: Expected "${expected}", but found "${found}"`);
            return this.failure(`Expected "${expected}", but found "${found}"`);
        }
        this.debugLog(`Must succeeded: "${expected}"`);
        return this.success(value);
    }

    /**
     * Helper method to attempt a parsing operation, returning a success result with undefined value if it fails.
     * Useful for implementing optional grammar rules.
     *
     * @param parser - A function that performs a parsing operation.
     * @returns A ParseResult containing the result of the parsing operation, or a success result with undefined value if it fails.
     */
    protected maybe<T>(parser: () => ParseResult<T>): ParseResult<T | undefined> {
        const pos = this.getPosition();
        const result = parser();
        if (result.success) {
            this.debugLog(`Maybe succeeded`);
            return result;
        } else {
            this.restorePosition(pos);
            this.debugLog(`Maybe failed`);
            return this.success(undefined);
        }
    }

    /**
     * Wraps a parsing operation with context information for better error reporting.
     *
     * @param context - A string describing the context of the parsing operation.
     * @param parser - A function that performs a parsing operation.
     * @returns A ParseResult containing the result of the parsing operation or a failure with added context information.
     */
    private indent = 0;
    protected withContext<T>(context: string, parser: () => ParseResult<T>): ParseResult<T> {
        const pos = this.getPosition();
        this.debugLog(`+ ${context} "${this.peek()}" ${this.getPosition()}`);
        this.indent++;
        const result = parser();
        this.indent--;
        if (result.success) {
            this.debugLog(`- ${context}`);
            return result;
        } else {
            this.debugLog(`x ${context}`);
            return {
                success: false,
                failure: {
                    message: `«${context}»`,
                    position: pos,
                    children: [result.failure]
                }
            };
        }
    }

    /**
     * Creates a success ParseResult with the given value.
     *
     * @param value - The value to wrap in a success result.
     * @returns A ParseResult indicating success with the given value.
     */
    protected success<T>(value: T): ParseResult<T> {
        return { success: true, value };
    }

    protected failure<T>(message: string): ParseResult<T> {
        return {
            success: false,
            failure: {
                message,
                position: this.getPosition()
            }
        };
    }

    successOrThrow<T>(result: ParseResult<T>): T {
        if (result.success) {
            return result.value;
        } else {
            throw new Error(result.failure.message);
        }
    }
}
