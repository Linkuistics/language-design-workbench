/**
 * @file parser.ts
 * @description Core parsing infrastructure for a custom parser implementation.
 *
 * This file provides the foundation for building specific parsers with built-in
 * trivia handling and error management. It defines the abstract Parser class,
 * which implements the InputStream interface and adds automatic trivia skipping
 * functionality.
 */

import { Builder, Stack } from './builder';
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
export abstract class ParserBase implements InputStream {
    /** Whether to skip trivia or not (true by default) */
    private skipTriviaEnabled: boolean = true;
    private debugEnabled: boolean;

    builder: Builder = new Builder();

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

    skip(count?: number): boolean {
        return this.input.skip(count);
    }

    skipString(str: string): boolean {
        return this.input.skipString(str);
    }

    skipRegex(regex: RegExp): boolean {
        return this.input.skipRegex(regex);
    }

    skipWhile(predicate: (char: string) => boolean): boolean {
        return this.input.skipWhile(predicate);
    }

    skipOptional(predicate: () => boolean): boolean {
        predicate();
        return true;
    }

    skipZeroOrMore(predicate: () => boolean): boolean {
        while (predicate());
        return true;
    }

    skipOneOrMore(predicate: () => boolean): boolean {
        if (!predicate()) return false;
        while (predicate());
        return true;
    }

    skipSeq(predicate: () => boolean): boolean {
        const position = this.getPosition();
        const depth = this.builder.depth();
        try {
            return predicate();
        } finally {
            this.builder.prune(depth);
            this.restorePosition(position);
        }
    }

    skipNegativeLookahead(predicate: () => boolean): boolean {
        const position = this.getPosition();
        const depth = this.builder.depth();
        if (predicate()) {
            this.builder.prune(depth);
            this.restorePosition(position);
            return false;
        }
        return true;
    }

    skipTrivia(predicate: () => boolean): boolean {
        const position = this.getPosition();
        const depth = this.builder.depth();
        if (this.skipTriviaEnabled) {
            while (true) {
                const kind = this.consumeTrivia();
                if (kind === undefined) break;
            }
        }
        try {
            return predicate();
        } finally {
            this.builder.prune(depth);
            this.restorePosition(position);
        }
    }

    ignoreSkipTriviaDuring<T>(predicate: () => boolean): boolean {
        if (this.skipTriviaEnabled) {
            while (true) {
                const kind = this.consumeTrivia();
                if (kind === undefined) break;
            }
            this.skipTriviaEnabled = false;
            try {
                return predicate();
            } finally {
                this.skipTriviaEnabled = true;
            }
        } else {
            return predicate();
        }
    }

    makeString(from: number, to: number): string {
        return this.input.makeString(from, to);
    }

    buildBoolean(label: string | undefined, parser: () => boolean): boolean {
        if (!parser()) return false;
        this.builder.push(label, true);
        return true;
    }

    buildString(label: string | undefined, parser: () => boolean): boolean {
        const pos = this.getPosition();
        if (!parser()) return false;
        this.builder.push(label, this.makeString(pos, this.getPosition()));
        return true;
    }

    buildStringObject<T>(
        label: string | undefined,
        factory: { new (init: { value: string }): T },
        parser: () => boolean
    ): boolean {
        const pos = this.getPosition();
        if (!parser()) return false;
        this.builder.push(label, new factory({ value: this.makeString(pos, this.getPosition()) }));
        return true;
    }

    buildEnum<T>(label: string | undefined, ...values: [string, T][]): boolean {
        for (const [text, value] of values) {
            if (this.skipString(text)) {
                this.builder.push(label, value);
                return true;
            }
        }
        return false;
    }

    buildObject<T>(label: string | undefined, buildFunction: (stack: Stack) => T, parser: () => boolean): boolean {
        const depth = this.builder.depth();
        if (parser()) {
            this.builder.create(depth, label, buildFunction);
            return true;
        } else {
            return false;
        }
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
    peek(): string | undefined {
        return this.input.peek();
    }

    /**
     * @inheritdoc
     */
    isEOF(): boolean {
        return this.input.isEOF();
    }
}
