// Generated on 2024-10-19T22:19:31.727Z
import * as Model from './src/gen0/languages/ldw/grammar/parsed/model';
import * as HappyPathParser from './src/gen0/parsing/happyPathParser';
import * as Builder from './src/gen0/parsing/builder';
import assert from 'assert';

export class Parser extends HappyPathParser.ParserBase {
    consumeIdentifierForKeyword(): string | undefined {
        const start = this.getPosition();
        if (this.#_lexIdentifier()) return this.makeString(start, this.input.getPosition());
        return undefined;
    }

    consumeTrivia(): string | undefined {
        if (this.#_lexLineComment()) return 'LineComment';
        if (this.#_lexBlockComment()) return 'BlockComment';
        if (this.#_lexWhitespace()) return 'Whitespace';
        return undefined;
    }

    #_lexLineComment(): boolean {
        return this.skipSeq(
            () =>
                this.skipString('//') &&
                this.skipZeroOrMore(() => this.skipRegex(/[^\n]/)) &&
                this.skipOptional(() => this.skipString('\\n'))
        );
    }

    #_lexBlockComment(): boolean {
        return this.skipSeq(
            () =>
                this.skipString('/*') &&
                this.skipZeroOrMore(
                    () =>
                        this.skipOneOrMore(() => this.skipRegex(/[^*]/)) ||
                        this.skipSeq(
                            () => this.skipString('*') && this.skipNegativeLookahead(() => this.skipString('/'))
                        )
                ) &&
                this.skipString('/')
        );
    }

    #_lexWhitespace(): boolean {
        return this.skipOneOrMore(() => this.skipRegex(/[\n\t ]/));
    }
}

class Build {}
