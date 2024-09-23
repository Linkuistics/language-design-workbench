/**
 * @file stringInputStream.ts
 * @description Implements the InputStream interface for string-based input processing.
 */

import { InputStream, LineAndColumn } from './inputStream';

/**
 * Implements the {@link InputStream} interface, providing methods for reading and manipulating string input.
 * This class is designed to work with string-based input sources, allowing for efficient parsing and manipulation
 * of string content.
 * 
 * @implements {InputStream}
 */
export class StringInputStream implements InputStream {
    private position: number;

    /**
     * Creates a new StringInputStream instance.
     * @param input - The input string to be parsed.
     */
    constructor(private input: string) {
        this.position = 0;
    }

    /**
     * Returns the current position in the input string.
     * @returns The current position as a number.
     */
    getPosition(): number {
        return this.position;
    }

    /**
     * Restores the stream to a previously saved position.
     * This method is crucial for implementing backtracking in the parser.
     * @param position - The position to restore to.
     */
    restorePosition(position: number): void {
        this.position = position;
    }

    /**
     * Converts a position to line and column information.
     * This method is useful for generating human-readable error messages.
     * 
     * @param position - The position to convert.
     * @returns An object containing line and column information.
     * 
     * @remarks
     * TODO: Optimize this method by caching values and using incremental calculation.
     */
    positionToLineAndColumn(position: number): LineAndColumn {
        let line = 1;
        let column = 1;
        let p = 0;
        while (p < position) {
            if (this.input[p] === '\n') {
                line++;
                column = 0;
            } else {
                column++;
            }
            p++;
        }
        return { line, column };
    }

    /**
     * Checks if the end of the input has been reached.
     * @returns True if at the end of the input, false otherwise.
     */
    isEOF(): boolean {
        return this.position >= this.input.length;
    }

    /**
     * Attempts to peek at upcoming characters in the input without consuming them.
     * This method is essential for lookahead operations in the parser.
     * 
     * @param lookAhead - The number of characters to look ahead (default is 0).
     * @returns The character at the specified look-ahead position, or undefined if beyond the input length.
     */
    peek(lookAhead: number = 0): string | undefined {
        const peekIndex = this.position + lookAhead;
        if (peekIndex >= this.input.length) {
            return undefined;
        }
        return this.input[peekIndex];
    }

    /**
     * Attempts to consume the specified number of characters from the input.
     * 
     * @param count - The number of characters to consume (default is 1).
     * @returns The consumed characters as a string, or undefined if no characters could be consumed.
     */
    consume(count: number = 1): string | undefined {
        if (count < 1) {
            return undefined;
        }
        const endIndex = Math.min(this.position + count, this.input.length);
        const chars = this.input.slice(this.position, endIndex);
        this.position = endIndex;
        return chars.length === 0 ? undefined : chars;
    }

    /**
     * Attempts to consume input matching a regular expression at the current position.
     * This method is useful for parsing complex patterns in the input.
     * 
     * @param regex - The regular expression to match.
     * @returns The consumed string if successful, or undefined if no match.
     * 
     * @remarks
     * TODO: Optimize this method to avoid creating a new string.
     */
    consumeRegex(regex: RegExp): string | undefined {
        const remainingInput = this.input.slice(this.position);
        const match = remainingInput.match(regex);
        if (match && match.index === 0) {
            const consumedString = match[0];
            this.position += consumedString.length;
            return consumedString;
        }
        return undefined;
    }

    /**
     * Attempts to consume a specific string at the current position.
     * This method is particularly useful for parsing keywords or specific sequences.
     * 
     * @param str - The string to consume.
     * @returns The consumed string if successful, or undefined if no match.
     */
    consumeString(str: string): string | undefined {
        if (this.input.startsWith(str, this.position)) {
            this.position += str.length;
            return str;
        }
        return undefined;
    }

    /**
     * Attempts to consume characters while the predicate function returns true.
     * This method allows for flexible, condition-based consumption of input.
     * 
     * @param predicate - A function that takes a character and returns a boolean.
     * @returns The consumed string, or undefined if no characters were consumed.
     */
    consumeWhile(predicate: (char: string) => boolean): string | undefined {
        let consumed = '';
        while (!this.isEOF()) {
            const char = this.peek();
            if (char === undefined || !predicate(char)) {
                break;
            }
            consumed += this.consume();
        }
        return consumed.length === 0 ? undefined : consumed;
    }
}