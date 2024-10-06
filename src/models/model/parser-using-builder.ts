import { InputStream } from '../../parser/inputStream';
import { ModelBuilder } from './builder';
import { Parser } from '../../parser/parser';
import { ParseError } from '../../parser/parseError';
import { PrimitiveType } from './model';

type TriviaKind = 'LineComment' | 'BlockComment' | 'Whitespace';
type Id = string;

export class ModelParserUsingBuilder extends Parser {
    private builder: ModelBuilder;

    constructor(input: InputStream) {
        super(input);
        this.builder = new ModelBuilder();
    }

    parse(): void {
        this.parseModel();
        if (!this.isEOF()) {
            const remainingContent = this.input.peek(20);
            throw new ParseError(
                `Unexpected content after model: "${remainingContent}${this.input.peek(1) ? '...' : ''}"`,
                this.getPosition(),
                this
            );
        }
    }

    private parseModel(): void {
        this.withContext('model', () => {
            this.mustConsumeKeyword('model');
            const name = this.parseId();
            this.builder.startModel(name);

            let parentName: string | undefined;
            if (this.consumeKeyword('modifies')) {
                parentName = this.parseId();
                this.builder.setModelParentName(parentName);
            }

            this.mustConsumeString('{');

            while (!this.isEOF() && this.peek() !== '}') {
                this.firstAlternative(
                    'model element',
                    () => this.parseDeletion(),
                    () => this.parseMemberModification(),
                    () => this.parseDefinition()
                );

                this.mustConsumeString(';');
            }

            this.mustConsumeString('}');

            this.builder.endModel();
        });
    }

    private parseDefinition(): void {
        this.withContext('definition', () => {
            const name = this.parseId();
            this.mustConsumeString('=');
            this.builder.startDefinition(name);
            this.parseType();
            this.builder.endDefinition();
        });
    }

    private parseDeletion(): void {
        this.mustConsumeKeyword('delete');
        const name = this.parseId();
        this.builder.addDeletion(name);
    }

    private parseMemberModification(): void {
        this.mustConsumeKeyword('modify');
        const name = this.parseId();
        this.builder.startMemberModification(name);
        this.mustConsumeString('{');
        while (!this.isEOF() && this.peek() !== '}') {
            this.firstAlternative(
                'member modification element',
                () => this.parseMemberDeletion(),
                () => this.parseMemberAddition()
            );
        }
        this.mustConsumeString('}');
        this.builder.endMemberModification();
    }

    private parseMemberDeletion(): void {
        this.mustConsumeString('-=');
        const name = this.parseId();
        this.builder.addMemberDeletion(name);
    }

    private parseMemberAddition(): void {
        this.mustConsumeString('+=');
        this.firstAlternative(
            'member addition element',
            () => this.parseProductMember(),
            () => this.parseType()
        );
        this.builder.addMemberAddition();
    }

    private parseType(): void {
        this.withContext('type', () => {
            this.firstAlternative(
                'type',
                () => this.parseVoidType(),
                () => this.parsePrimitiveType(),
                () => this.parseEnumType(),
                () => this.parseTypeWithStructure(),
                () => this.parseNamedTypeReference()
            );
        });
    }

    private parseVoidType(): void {
        this.mustConsumeString('()');
        this.builder.createVoidType();
    }

    private parsePrimitiveType(): void {
        const type = this.firstAlternative(
            'primitive type',
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
        ) as PrimitiveType;
        this.builder.createPrimitiveType(type);
    }

    private parseEnumType(): void {
        this.withContext('enum type', () => {
            this.mustConsumeString('{');
            this.builder.startEnumType();
            this.builder.addEnumMember(this.parseString());
            while (this.consumeString('|')) {
                this.builder.addEnumMember(this.parseString());
            }
            this.mustConsumeString('}');
        });
    }

    private parseString(): string {
        this.mustConsumeString('"');
        const value = this.parseId();
        this.mustConsumeString('"');
        return value;
    }

    private parseTypeWithStructure(): void {
        this.withContext('type with structure', () => {
            this.firstAlternative(
                'type with structure',
                () => this.parseSumType(),
                () => this.parseProductType(),
                () => this.parseGenericType()
            );
        });
    }

    private parseSumType(): void {
        this.withContext('sum type', () => {
            this.mustConsumeString('{');
            this.builder.startSumType();
            this.parseType();
            this.builder.addSumTypeMember();
            while (this.consumeString('|')) {
                this.parseType();
                this.builder.addSumTypeMember();
            }
            this.mustConsumeString('}');
            this.builder.endSumType();
        });
    }

    private parseProductType(): void {
        this.withContext('product type', () => {
            this.mustConsumeString('{');
            this.builder.startProductType();
            this.maybe(() => {
                this.parseProductMember();
                while (this.consumeString(',')) {
                    this.parseProductMember();
                }
            });
            this.mustConsumeString('}');
            this.builder.endProductType();
        });
    }

    private parseProductMember(): void {
        this.withContext('product member', () => {
            const name = this.parseId();
            this.mustConsumeString(':');
            this.builder.startProductType();
            this.parseType();
            this.builder.addProductTypeMember(name);
        });
    }

    private parseGenericType(): void {
        this.withContext('generic type', () => {
            this.firstAlternative(
                'generic type',
                () => this.parseTupleType(),
                () => this.parseMapType(),
                () => this.parseSetType(),
                () => this.parseSequenceType(),
                () => this.parseOptionType(),
                () => this.parseResultType()
            );
        });
    }

    private parseTupleType(): void {
        this.mustConsumeString('tuple<');
        this.builder.startTupleType();
        this.parseType();
        this.builder.addTupleTypeMember();
        while (this.consumeString(',')) {
            this.parseType();
            this.builder.addTupleTypeMember();
        }
        this.mustConsumeString('>');
        this.builder.endTupleType();
    }

    private parseMapType(): void {
        this.mustConsumeString('map<');
        this.parseType();
        this.mustConsumeString(',');
        this.parseType();
        this.mustConsumeString('>');
        this.builder.createMapType();
    }

    private parseSetType(): void {
        this.mustConsumeString('set<');
        this.parseType();
        this.mustConsumeString('>');
        this.builder.createSetType();
    }

    private parseSequenceType(): void {
        this.mustConsumeString('seq<');
        this.parseType();
        this.mustConsumeString('>');
        this.builder.createSequenceType();
    }

    private parseOptionType(): void {
        this.mustConsumeString('option<');
        this.parseType();
        this.mustConsumeString('>');
        this.builder.createOptionType();
    }

    private parseResultType(): void {
        this.mustConsumeString('result<');
        this.parseType();
        this.mustConsumeString(',');
        this.parseType();
        this.mustConsumeString('>');
        this.builder.createResultType();
    }

    private parseNamedTypeReference(): void {
        this.withContext('named type reference', () => {
            const names: Id[] = [];
            names.push(this.parseId());
            while (this.consumeString('::')) {
                names.push(this.parseId());
            }
            this.builder.createNamedTypeReference(names);
        });
    }

    parseId(): Id {
        return this.mustConsumeRegex(/^[a-zA-Z_][a-zA-Z0-9_]*/, 'id');
    }

    protected consumeTrivia(): string | undefined {
        return this.parseTrivia();
    }

    protected consumeIdentifierForKeyword(): string | undefined {
        return this.consumeRegex(/^[a-zA-Z_][a-zA-Z0-9_]*/);
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
}
