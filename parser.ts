import { InputStream } from './src/gen0/parsing/inputStream';
import * as Model from './src/gen0/languages/ldw/grammar/parsed/model';
import { Parser, ParseResult } from './src/gen0/parsing/parser';

export class ParsedParser extends Parser {
    consumeTrivia(): string | undefined {
        return undefined;
    }
    consumeIdentifierForKeyword(): string | undefined {
        return undefined;
    }

    lexVersionSegment(): boolean {
        return this.skipOneOrMore(() => this.skipRegex(/^[0-9]/));
    }

    parseVersionSegment(): ParseResult<Model.VersionSegment> {
        const start = this.getPosition();
        return this.lexVersionSegment()
            ? this.success(this.makeString(start, this.input.getPosition()))
            : this.failure('Failed to lex a VersionSegment');
    }

    lexStringElement(): boolean {
        return (
            this.skipSeq(
                () =>
                    this.skipString("'") &&
                    this.skipZeroOrMore(
                        () =>
                            this.skipZeroOrMore(() => this.skipRegex(/^[^'\\\n]/)) ||
                            this.skipSeq(() => this.skipString('\\\\') && this.skipRegex(/^['\\]/))
                    ) &&
                    this.skipString("'")
            ) ||
            this.skipSeq(
                () =>
                    this.skipString('"') &&
                    this.skipZeroOrMore(
                        () =>
                            this.skipZeroOrMore(() => this.skipRegex(/^[^"\\\n]/)) ||
                            this.skipSeq(() => this.skipString('\\\\') && this.skipRegex(/^["\\]/))
                    ) &&
                    this.skipString('"')
            )
        );
    }

    parseStringElement(): ParseResult<Model.StringElement> {
        const start = this.getPosition();
        return this.lexStringElement()
            ? this.success(new Model.StringElement({ value: this.makeString(start, this.input.getPosition()) }))
            : this.failure('Failed to lex a StringElement');
    }

    lexCharSetChar(): boolean {
        return (
            this.skipRegex(/^[^\\\-\]]/) ||
            this.skipSeq(() => this.skipString('\\\\') && this.skipRegex(/^[\^\\\-\]nt]/))
        );
    }

    parseCharSetChar(): ParseResult<Model.CharSetChar> {
        const start = this.getPosition();
        return this.lexCharSetChar()
            ? this.success(this.makeString(start, this.input.getPosition()))
            : this.failure('Failed to lex a CharSetChar');
    }

    lexIdentifier(): boolean {
        return this.skipSeq(
            () => this.skipRegex(/^[a-zA-Z_]/) && this.skipZeroOrMore(() => this.skipRegex(/^[a-zA-Z0-9_]/))
        );
    }

    parseIdentifier(): ParseResult<Model.Identifier> {
        const start = this.getPosition();
        return this.lexIdentifier()
            ? this.success(this.makeString(start, this.input.getPosition()))
            : this.failure('Failed to lex a Identifier');
    }

    lexLineComment(): boolean {
        return this.skipSeq(
            () =>
                this.skipString('//') &&
                this.skipZeroOrMore(() => this.skipRegex(/^[^\n]/)) &&
                this.skipOptional(() => this.skipString('\\n'))
        );
    }

    parseLineComment(): ParseResult<Model.LineComment> {
        const start = this.getPosition();
        return this.lexLineComment()
            ? this.success(new Model.LineComment({ value: this.makeString(start, this.input.getPosition()) }))
            : this.failure('Failed to lex a LineComment');
    }

    lexBlockComment(): boolean {
        return this.skipSeq(
            () =>
                this.skipString('/*') &&
                this.skipZeroOrMore(
                    () =>
                        this.skipOneOrMore(() => this.skipRegex(/^[^*]/)) ||
                        this.skipSeq(
                            () => this.skipString('*') && this.skipNegativeLookahead(() => this.skipString('/'))
                        )
                ) &&
                this.skipString('/')
        );
    }

    parseBlockComment(): ParseResult<Model.BlockComment> {
        const start = this.getPosition();
        return this.lexBlockComment()
            ? this.success(new Model.BlockComment({ value: this.makeString(start, this.input.getPosition()) }))
            : this.failure('Failed to lex a BlockComment');
    }

    lexWhitespace(): boolean {
        return this.skipOneOrMore(() => this.skipRegex(/^[\n\t ]/));
    }

    parseWhitespace(): ParseResult<Model.Whitespace> {
        const start = this.getPosition();
        return this.lexWhitespace()
            ? this.success(new Model.Whitespace({ value: this.makeString(start, this.input.getPosition()) }))
            : this.failure('Failed to lex a Whitespace');
    }
}
