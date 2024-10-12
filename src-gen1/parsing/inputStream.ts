/**
 * @file inputStream.ts
 * @description Defines core interfaces for input stream handling in the parser.
 */

/**
 * Represents line and column information for a position in the input.
 * This interface is used to provide more human-readable position information.
 */
export interface LineAndColumn {
    /** The line number in the input (1-based) */
    line: number;
    /** The column number in the input (1-based) */
    column: number;
}

/**
 * Defines the interface for input stream classes, providing methods for reading and manipulating input.
 * This interface serves as a contract for various input stream implementations, allowing for flexibility
 * in how input is sourced and processed.
 */
export interface InputStream {
    /**
     * Returns the current position in the input.
     * @returns The current position as a number.
     */
    getPosition(): number;

    /**
     * Restores the stream to a previously saved position.
     * This method is crucial for implementing backtracking in the parser.
     * @param position - The position to restore to.
     */
    restorePosition(position: number): void;

    /**
     * Converts a position to line and column information.
     * This method is useful for generating human-readable error messages.
     * @param position - The position to convert.
     * @returns An object containing line and column information.
     */
    positionToLineAndColumn(position: number): LineAndColumn;

    /**
     * Checks if the end of the input has been reached.
     * @returns True if at the end of the input, false otherwise.
     */
    isEOF(): boolean;

    /**
     * Attempts to peek at upcoming characters in the input without consuming them.
     * This method is essential for lookahead operations in the parser.
     * @param lookAhead - The number of characters to look ahead (default is 0).
     * @returns The character at the specified look-ahead position, or undefined if beyond the input length.
     */
    peek(lookAhead?: number): string | undefined;

    /**
     * Attempts to consume the specified number of characters from the input.
     * @param count - The number of characters to consume (default is 1).
     * @returns The consumed characters as a string, or undefined if no characters could be consumed.
     */
    consume(count?: number): string | undefined;

    /**
     * Attempts to consume input matching a regular expression at the current position.
     * This method is useful for parsing complex patterns in the input.
     * @param regex - The regular expression to match.
     * @returns The consumed string if successful, or undefined if no match.
     */
    consumeRegex(regex: RegExp): string | undefined;

    /**
     * Attempts to consume a specific string at the current position.
     * This method is particularly useful for parsing keywords or specific sequences.
     * @param str - The string to consume.
     * @returns The consumed string if successful, or undefined if no match.
     */
    consumeString(str: string): string | undefined;

    /**
     * Attempts to consume characters while the predicate function returns true.
     * This method allows for flexible, condition-based consumption of input.
     * @param predicate - A function that takes a character and returns a boolean.
     * @returns The consumed string, or undefined if no characters were consumed.
     */
    consumeWhile(predicate: (char: string) => boolean): string | undefined;
}