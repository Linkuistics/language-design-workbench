import { InputStream } from '../../../../../parsing/inputStream';
import * as Model from '../model';
import { Parser } from '../../../../../parsing/parser';
import { ParseError } from '../../../../../parsing/parseError';

type TriviaKind = 'LineComment' | 'BlockComment' | 'DatumComment' | 'Whitespace';

export class SexprParser extends Parser {
    constructor(input: InputStream) {
        super(input);
    }

    parse(): Model.Datum {
        const datum = this.parseDatum();
        if (!this.isEOF()) {
            throw new ParseError('Unexpected content after datum', this.getPosition(), this);
        }
        return datum;
    }

    private parseDatum(): Model.Datum {
        return this.withContext('datum', () => {
            return this.firstAlternative(
                'datum',
                () => this.parseBoolean(),
                () => this.parseCharacter(),
                () => this.parseNumber(),
                () => this.parseAbbreviation(),
                () => this.parseString(),
                () => this.parseList(),
                () => this.parseVector(),
                () => this.parseByteVector(),
                () => this.parseStruct(),
                () => this.parseSymbol()
            );
        });
    }

    private parseBoolean(): Model.Datum {
        if (this.consumeString('#t') || this.consumeString('#T')) {
            return { boolean: Model.Boolean.True };
        }
        if (this.consumeString('#f') || this.consumeString('#F')) {
            return { boolean: Model.Boolean.False };
        }
        throw new ParseError('Expected boolean', this.getPosition(), this);
    }

    private parseCharacter(): Model.Datum {
        return this.ignoreTriviaDuring(() => {
            if (this.consumeString('#\\')) {
                if (this.peek() === 'x') {
                    this.consume();
                    const hexValue = this.consumeRegex(/^[0-9a-fA-F]+/);
                    if (hexValue) {
                        const charCode = parseInt(hexValue, 16);
                        if (charCode > 0x10ffff) {
                            throw new ParseError('Invalid Unicode character', this.getPosition(), this);
                        }
                        return { char: String.fromCodePoint(charCode) };
                    }
                    throw new ParseError('Expected hex value for character', this.getPosition(), this);
                }
                const namedChar = this.consumeRegex(
                    /^(alarm|backspace|delete|esc|linefeed|newline|page|return|space|tab|vtab)/
                );
                if (namedChar) {
                    const characterName = this.stringToCharacterName(namedChar);
                    if (characterName !== undefined) {
                        return { characterName };
                    }
                    throw new ParseError(`Invalid character name: ${namedChar}`, this.getPosition(), this);
                }
                return {
                    char: this.must(this.consume(), 'Expected character')
                };
            }
            throw new ParseError('Expected character', this.getPosition(), this);
        });
    }

    private stringToCharacterName(name: string): Model.CharacterName | undefined {
        switch (name) {
            case 'alarm':
                return Model.CharacterName.Alarm;
            case 'backspace':
                return Model.CharacterName.Backspace;
            case 'delete':
                return Model.CharacterName.Delete;
            case 'esc':
                return Model.CharacterName.Esc;
            case 'linefeed':
                return Model.CharacterName.Linefeed;
            case 'newline':
                return Model.CharacterName.Newline;
            case 'page':
                return Model.CharacterName.Page;
            case 'return':
                return Model.CharacterName.Return;
            case 'space':
                return Model.CharacterName.Space;
            case 'tab':
                return Model.CharacterName.Tab;
            case 'vtab':
                return Model.CharacterName.Vtab;
            default:
                return undefined;
        }
    }

    private parseSymbol(): Model.Symbol {
        if (this.consumeString('...')) return '...';
        if (this.consumeString('+')) return '+';
        if (this.consumeString('-')) return '-';
        return this.mustConsumeRegex(/^([a-zA-Z!$%&*/:<=>?~_^][a-zA-Z0-9!$%&*/:<=>?~_^.+-@]*)/, 'symbol');
    }

    private parseString(): Model.String {
        return this.ignoreTriviaDuring(() => {
            this.mustConsumeString('"');
            let value = '';
            while (this.peek() !== '"' && !this.isEOF()) {
                if (this.peek() === '\\') {
                    this.consume();
                    const escapeChar = this.consume();
                    if (escapeChar === undefined) {
                        throw new ParseError('Unexpected end of input', this.getPosition(), this);
                    }
                    switch (escapeChar) {
                        case '"':
                            value += '"';
                            break;
                        case '\\':
                            value += '\\';
                            break;
                        case 'n':
                            value += '\n';
                            break;
                        case 't':
                            value += '\t';
                            break;
                        case 'r':
                            value += '\r';
                            break;
                        case 'x':
                            const hexValue = this.consumeRegex(/^[0-9a-fA-F]+/);
                            if (hexValue) {
                                value += String.fromCharCode(parseInt(hexValue, 16));
                            } else {
                                throw new ParseError('Invalid hex escape in string', this.getPosition(), this);
                            }
                            break;
                        default:
                            throw new ParseError(
                                `Invalid escape sequence in string: \\${escapeChar}`,
                                this.getPosition(),
                                this
                            );
                    }
                } else {
                    const char = this.consume();
                    if (char === undefined) {
                        throw new ParseError('Unexpected end of input', this.getPosition(), this);
                    }
                    value += char;
                }
            }
            this.mustConsumeString('"');
            return new Model.String(value);
        });
    }

    private parseNumber(): Model.Number {
        return this.ignoreTriviaDuring(() => {
            const sign = this.consumeString('+') ? '+' : this.consumeString('-') ? '-' : '';
            if (this.consumeString('#b')) {
                const value = sign + this.mustConsumeRegex(/^[01]+/, 'binary number');
                return new Model.Num2(value);
            }
            if (this.consumeString('#x')) {
                const value = sign + this.mustConsumeRegex(/^[0-9a-fA-F]+/, 'hexadecimal number');
                return new Model.Num16(value);
            }
            const value = sign + this.mustConsumeRegex(/^[0-9]+/, 'decimal number');
            return new Model.Num10(value);
        });
    }

    private parseList(): Model.List {
        const openDelimiter = this.must(
            this.consumeString('(') || this.consumeString('[') || this.consumeString('{'),
            'list opening delimiter'
        );
        const closeDelimiter = openDelimiter === '(' ? ')' : openDelimiter === '[' ? ']' : '}';

        if (this.peek() === closeDelimiter) {
            this.consume();
            return { data: [], tail: undefined };
        }

        const data: Model.Datum[] = [];
        let tail: Model.Datum | undefined;

        while (this.peek() !== closeDelimiter && !this.isEOF()) {
            if (this.consumeString('.')) {
                tail = this.parseDatum();
                break;
            }
            data.push(this.parseDatum());
        }

        this.mustConsumeString(closeDelimiter);
        return { data, tail };
    }

    private parseVector(): Model.Vector {
        const openDelimiter = this.must(
            this.consumeString('#(') || this.consumeString('#[') || this.consumeString('#{'),
            'vector opening delimiter'
        );
        const closeDelimiter = openDelimiter === '#(' ? ')' : openDelimiter === '#[' ? ']' : '}';

        const data: Model.Datum[] = [];
        while (this.peek() !== closeDelimiter && !this.isEOF()) {
            data.push(this.parseDatum());
        }

        this.mustConsumeString(closeDelimiter);
        return new Model.Vector(data);
    }

    private parseByteVector(): Model.ByteVector {
        const openDelimiter = this.must(
            this.consumeString('#vu8(') || this.consumeString('#vu8[') || this.consumeString('#vu8{'),
            'byte vector opening delimiter'
        );
        const closeDelimiter = openDelimiter === '#vu8(' ? ')' : openDelimiter === '#vu8[' ? ']' : '}';

        const numbers: Model.Number[] = [];
        while (this.peek() !== closeDelimiter && !this.isEOF()) {
            const number = this.parseNumber();
            let value: number;
            if (number instanceof Model.Num2) {
                value = parseInt(number.value, 2);
            } else if (number instanceof Model.Num16) {
                value = parseInt(number.value, 16);
            } else {
                value = parseInt(number.value, 10);
            }
            if (value < 0 || value > 255) {
                throw new ParseError(`Byte vector value out of range: ${value}`, this.getPosition(), this);
            }
            numbers.push(number);
        }

        this.mustConsumeString(closeDelimiter);
        return new Model.ByteVector(numbers);
    }

    private parseStruct(): Model.Struct {
        const openDelimiter = this.must(
            this.consumeString('#s(') || this.consumeString('#s[') || this.consumeString('#s{'),
            'struct opening delimiter'
        );
        const closeDelimiter = openDelimiter === '#s(' ? ')' : openDelimiter === '#s[' ? ']' : '}';

        const name = this.parseSymbol();
        const data: Model.Datum[] = [];
        while (this.peek() !== closeDelimiter && !this.isEOF()) {
            data.push(this.parseDatum());
        }

        this.mustConsumeString(closeDelimiter);
        return new Model.Struct(name, data);
    }

    private parseAbbreviation(): Model.List {
        const abbreviation = this.must(
            this.consumeString("'") || this.consumeString('`') || this.consumeString(',@') || this.consumeString(','),
            'abbreviation'
        );

        const datum = this.parseDatum();
        const abbreviationSymbol = this.abbreviationToSymbol(abbreviation);

        return { data: [abbreviationSymbol, datum], tail: undefined };
    }

    private abbreviationToSymbol(abbreviation: string): Model.Symbol {
        switch (abbreviation) {
            case "'":
                return 'quote';
            case '`':
                return 'quasiquote';
            case ',':
                return 'unquote';
            case ',@':
                return 'unquote-splicing';
            default:
                throw new ParseError('Invalid abbreviation', this.getPosition(), this);
        }
    }

    protected consumeTrivia(): TriviaKind | undefined {
        if (this.parseLineComment()) return 'LineComment';
        if (this.parseBlockComment()) return 'BlockComment';
        if (this.parseDatumComment()) return 'DatumComment';
        if (this.parseWhitespace()) return 'Whitespace';
        return undefined;
    }

    private parseLineComment(): boolean {
        if (this.consumeString(';') === undefined) return false;
        this.consumeWhile((c) => c !== '\n');
        this.consumeString('\n');
        return true;
    }

    private parseBlockComment(): boolean {
        if (this.consumeString('#|') === undefined) return false;
        let depth = 1;
        while (depth > 0 && !this.isEOF()) {
            if (this.consumeString('#|')) {
                depth++;
            } else if (this.consumeString('|#')) {
                depth--;
            } else {
                this.consume();
            }
        }
        return depth === 0;
    }

    private parseDatumComment(): boolean {
        if (this.consumeString('#;') === undefined) return false;
        this.parseDatum();
        return true;
    }

    private parseWhitespace(): boolean {
        return this.consumeRegex(/[\n\t ]+/) !== undefined;
    }

    protected consumeIdentifierForKeyword(): string | undefined {
        // This grammar has no keywords
        return undefined;
    }
}
