import { InputStream } from '../../parser/inputStream';
import * as Model from './new-model';
import { Parser } from '../../parser/parser';
import { ParseError } from '../../parser/parseError';

type TriviaKind = 'LineComment' | 'BlockComment' | 'Whitespace';

export class LDWMParser extends Parser {
    constructor(input: InputStream) {
        super(input);
    }

    parse(): Model.Model {
        const model = this.parseModel();
        if (!this.isEOF()) {
            throw new ParseError(
                'Unexpected content after model',
                this.getPosition(),
                this
            );
        }
        return model;
    }

    private parseModel(): void {
        this.mustConsumeKeyword('model');
        this.parseId();
        this.mustConsumeString('{');
        this.maybe(() => {
            this.mustConsumeKeyword('modifies');
            return this.parseId();
        });
        this.zeroOrMore(() => {
            this.firstAlternative(
                '',
                () => this.parseDefinition(),
                () => this.parseDeletion(),
                () => this.parseMemberModification()
            );
            this.mustConsumeString(';');
        });
        this.mustConsumeString('}');
    }

    parseDefinition(): void {
        this.parseId();
        this.mustConsumeString('=');
        this.parseType();
    }

    parseDeletion(): void {
        this.mustConsumeKeyword('delete');
        this.parseId();
    }

    parseMemberModification(): void {
        this.mustConsumeKeyword('modify');
        this.parseId();
        this.zeroOrMore(() => {
            this.firstAlternative(
                '',
                () => this.parseMemberDeletion(),
                () => this.parseMemberAddition()
            );
        });
    }

    parseMemberDeletion(): void {
        this.mustConsumeString('-=');
        this.zeroOrMore(() => {
            this.firstAlternative(
                '',
                () => this.parseId(),
                () => this.parseNamedTypeReference()
            );
        });
    }

    parseMemberAddition(): void {
        this.mustConsumeString('+=');
        this.zeroOrMore(() => {
            this.firstAlternative(
                '',
                () => this.parseType(),
                () => this.parseProductMember()
            );
        });
    }

    parseType(): void {
        this.firstAlternative(
            '',
            () => this.parseVoidType(),
            () => this.parsePrimitiveType(),
            () => this.parseEnumType(),
            () => this.parseTypeWithStructure(),
            () => this.parseNamedTypeReference()
        );
    }

    parseVoidType(): void {
        this.mustConsumeString('()');
    }

    parsePrimitiveType(): void {
        this.firstAlternative(
            '',
            () => this.mustConsumeKeyword('boolean'),
            () => this.mustConsumeKeyword('char'),
            () => this.mustConsumeKeyword('string'),
            () => this.mustConsumeKeyword('i8'),
            () => this.mustConsumeKeyword('i16'),
            () => this.mustConsumeKeyword('i32'),
            () => this.mustConsumeKeyword('i64'),
            () => this.mustConsumeKeyword('u8'),
            () => this.mustConsumeKeyword('u16'),
            () => this.mustConsumeKeyword('u32'),
            () => this.mustConsumeKeyword('u64'),
            () => this.mustConsumeKeyword('f32'),
            () => this.mustConsumeKeyword('f64')
        );
    }

    parseEnumType(): void {
        this.mustConsumeString('{');
        this.zeroOrMore(() => {
            this.parseString();
        });
        this.mustConsumeString('}');
    }

    parseString(): void {
        this.mustConsumeString('"');
        this.mustConsumeRegex(/^[a-zA-Z0-9]+/, 'string');
        this.mustConsumeString('"');
    }

    parseTypeWithStructure(): void {
        this.firstAlternative(
            '',
            () => this.parseSumType(),
            () => this.parseProductType(),
            () => this.parseGenericType()
        );
    }

    parseSumType(): void {
        this.mustConsumeString('{');
        this.parseId();
        this.zeroOrMore(() => {
            this.mustConsumeString('|');
            this.parseId();
        });
        this.mustConsumeString('}');
    }

    parseProductType(): void {
        this.mustConsumeString('{');
        this.parseProductMember();
        this.zeroOrMore(() => {
            this.mustConsumeString(',');
            this.parseProductMember();
        });
        this.mustConsumeString('}');
    }

    parseProductMember(): void {
        this.parseId();
        this.mustConsumeString(':');
        this.parseType();
    }

    parseGenericType(): void {
        this.firstAlternative(
            '',
            () => this.parseTupleType(),
            () => this.parseMapType(),
            () => this.parseSetType(),
            () => this.parseSequenceType(),
            () => this.parseOptionType(),
            () => this.parseResultType()
        );
    }

    parseTupleType(): void {
        this.mustConsumeString('tuple<');
        this.parseType();
        this.zeroOrMore(() => {
            this.mustConsumeString(',');
            this.parseType();
        });
        this.mustConsumeString('>');
    }

    parseMapType(): void {
        this.mustConsumeString('map<');
        this.parseType();
        this.mustConsumeString(',');
        this.parseType();
        this.mustConsumeString('>');
    }

    parseSetType(): void {
        this.mustConsumeString('set<');
        this.parseType();
        this.mustConsumeString('>');
    }

    parseSequenceType(): void {
        this.mustConsumeString('seq<');
        this.parseType();
        this.mustConsumeString('>');
    }

    parseOptionType(): void {
        this.mustConsumeString('option<');
        this.parseType();
        this.mustConsumeString('>');
    }

    parseResultType(): void {
        this.mustConsumeString('result<');
        this.parseType();
        this.mustConsumeString(',');
        this.parseType();
        this.mustConsumeString('>');
    }

    parseNamedTypeReference(): void {
        this.parseId();
        this.zeroOrMore(() => {
            this.mustConsumeString('::');
            this.parseId();
        });
    }

    parseId(): string {
        return this.mustConsumeRegex(/^[a-zA-Z_][a-zA-Z0-9_]*/, 'id');
    }

    private parseTrivia(): TriviaKind | undefined {
        if (this.parseLineComment()) return 'LineComment';
        if (this.parseBlockComment()) return 'BlockComment';
        if (this.parseWhitespace()) return 'Whitespace';
        return undefined;
    }

    private parseLineComment(): boolean {
        if (this.consumeString('//') === undefined) return false;
        this.consumeWhile((c) => c !== '\n');
        this.consumeString('\n');
        return true;
    }

    private parseBlockComment(): boolean {
        if (this.consumeString('/*') === undefined) return false;
        while (
            this.consumeRegex(/[^*]+/) !== undefined ||
            (this.consumeString('*') !== undefined && this.peek() !== '/')
        ) {}
        if (this.consumeString('/') === undefined) return false;
        return true;
    }

    private parseWhitespace(): boolean {
        return this.consumeRegex(/[\n\t ]+/) !== undefined;
    }

    protected consumeTrivia(): string | undefined {
        return this.parseTrivia();
    }

    protected consumeIdentifierForKeyword(): string | undefined {
        return this.consumeRegex(/^[a-zA-Z_][a-zA-Z0-9_]*/);
    }
}
