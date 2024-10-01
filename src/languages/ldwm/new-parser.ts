import { InputStream } from '../../parser/inputStream';
import * as Model from './new-model';
import { Parser } from '../../parser/parser';
import { ParseError } from '../../parser/parseError';

type TriviaKind = 'LineComment' | 'BlockComment' | 'Whitespace';
type Id = string;

export class LDWMParser extends Parser {
    constructor(input: InputStream) {
        super(input);
    }

    parse(): Model.Model {
        const model = this.parseModel();
        if (!this.isEOF()) {
            const remainingContent = this.input.peek(20);
            throw new ParseError(
                `Unexpected content after model: "${remainingContent}${this.input.peek(1) ? '...' : ''}"`,
                this.getPosition(),
                this
            );
        }
        return model;
    }

    private parseModel(): Model.Model {
        return this.withContext('model', () => {
            this.mustConsumeKeyword('model');
            const name = this.parseId();

            let parentName: string | undefined;
            if (this.consumeKeyword('modifies')) {
                parentName = this.parseId();
                console.log('Model modifies: ' + parentName);
            }

            this.mustConsumeString('{');

            const values: (
                | Model.Definition
                | Model.Deletion
                | Model.MemberModification
            )[] = [];

            while (!this.isEOF() && this.peek() !== '}') {
                const element = this.firstAlternative(
                    'model element',
                    () => this.parseDeletion(),
                    () => this.parseMemberModification(),
                    () => this.parseDefinition()
                );
                values.push(element);

                this.consumeTrivia();
                if (this.peek() === ';') {
                    this.mustConsumeString(';');
                }
            }

            this.mustConsumeString('}');
            return new Model.Model(name, parentName, values);
        });
    }

    parseDefinition(): Model.Definition {
        return this.withContext('definition', () => {
            const name = this.parseId();
            this.mustConsumeString('=');
            const type = this.parseType();
            return new Model.Definition(name, type);
        });
    }

    parseDeletion(): Model.Deletion {
        this.mustConsumeKeyword('delete');
        const name = this.parseId();
        return new Model.Deletion(name);
    }

    parseMemberModification(): Model.MemberModification {
        this.mustConsumeKeyword('modify');
        const name = this.parseId();
        this.mustConsumeString('{');
        const values: (Model.MemberDeletion | Model.MemberAddition)[] = [];
        while (!this.isEOF() && this.peek() !== '}') {
            values.push(
                this.firstAlternative(
                    'member modification element',
                    () => this.parseMemberDeletion(),
                    () => this.parseMemberAddition()
                )
            );
        }
        this.mustConsumeString('}');
        return new Model.MemberModification(name, values);
    }

    parseMemberDeletion(): Model.MemberDeletion {
        this.mustConsumeString('-=');
        const name = this.parseId();
        return new Model.MemberDeletion(name);
    }

    parseMemberAddition(): Model.MemberAddition {
        this.mustConsumeString('+=');
        const value = this.firstAlternative(
            'member addition element',
            () => this.parseProductMember(),
            () => this.parseType()
        );
        return new Model.MemberAddition(value);
    }

    parseType(): Model.Type {
        return this.withContext('type', () => {
            return this.firstAlternative(
                'type',
                () => this.parseVoidType(),
                () => this.parsePrimitiveType(),
                () => this.parseEnumType(),
                () => this.parseTypeWithStructure(),
                () => this.parseNamedTypeReference()
            );
        });
    }

    parseVoidType(): Model.VoidType {
        this.mustConsumeString('()');
        return new Model.VoidType();
    }

    parsePrimitiveType(): Model.PrimitiveType {
        return this.firstAlternative(
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
        ) as Model.PrimitiveType;
    }

    parseEnumType(): Model.EnumType {
        return this.withContext('enum type', () => {
            this.mustConsumeString('{');
            const members: Id[] = [];
            members.push(this.parseString());
            while (this.consumeString('|')) {
                members.push(this.parseString());
            }
            this.mustConsumeString('}');
            return new Model.EnumType(members);
        });
    }

    parseString(): string {
        this.mustConsumeString('"');
        const value = this.parseId();
        this.mustConsumeString('"');
        return value;
    }

    parseTypeWithStructure(): Model.TypeWithStructure {
        return this.withContext('type with structure', () => {
            return this.firstAlternative(
                'type with structure',
                () => this.parseSumType(),
                () => this.parseProductType(),
                () => this.parseGenericType()
            );
        });
    }

    parseSumType(): Model.SumType {
        return this.withContext('sum type', () => {
            this.mustConsumeString('{');
            const members: Model.Type[] = [];
            members.push(this.parseType());
            while (this.consumeString('|')) {
                members.push(this.parseType());
            }
            this.mustConsumeString('}');
            return new Model.SumType(members);
        });
    }

    parseProductType(): Model.ProductType {
        return this.withContext('product type', () => {
            this.mustConsumeString('{');
            const members: Model.ProductMember[] = [];
            this.maybe(() => {
                members.push(this.parseProductMember());
                while (this.consumeString(',')) {
                    members.push(this.parseProductMember());
                }
            });
            this.mustConsumeString('}');
            return new Model.ProductType(members);
        });
    }

    parseProductMember(): Model.ProductMember {
        return this.withContext('product member', () => {
            const name = this.parseId();
            this.mustConsumeString(':');
            const type = this.parseType();
            return new Model.ProductMember(name, type);
        });
    }

    parseGenericType(): Model.GenericType {
        return this.withContext('generic type', () => {
            return this.firstAlternative(
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

    parseTupleType(): Model.TupleType {
        this.mustConsumeString('tuple<');
        const members: Model.Type[] = [];
        members.push(this.parseType());
        while (this.consumeString(',')) {
            members.push(this.parseType());
        }
        this.mustConsumeString('>');
        return new Model.TupleType(members);
    }

    parseMapType(): Model.MapType {
        this.mustConsumeString('map<');
        const keyType = this.parseType();
        this.mustConsumeString(',');
        const valueType = this.parseType();
        this.mustConsumeString('>');
        return new Model.MapType(keyType, valueType);
    }

    parseSetType(): Model.SetType {
        this.mustConsumeString('set<');
        const keyType = this.parseType();
        this.mustConsumeString('>');
        return new Model.SetType(keyType);
    }

    parseSequenceType(): Model.SequenceType {
        this.mustConsumeString('seq<');
        const elementType = this.parseType();
        this.mustConsumeString('>');
        return new Model.SequenceType(elementType);
    }

    parseOptionType(): Model.OptionType {
        this.mustConsumeString('option<');
        const type = this.parseType();
        this.mustConsumeString('>');
        return new Model.OptionType(type);
    }

    parseResultType(): Model.ResultType {
        this.mustConsumeString('result<');
        const okType = this.parseType();
        this.mustConsumeString(',');
        const errType = this.parseType();
        this.mustConsumeString('>');
        return new Model.ResultType(okType, errType);
    }

    parseNamedTypeReference(): Model.NamedTypeReference {
        return this.withContext('named type reference', () => {
            const names: Id[] = [];
            names.push(this.parseId());
            while (this.consumeString('::')) {
                names.push(this.parseId());
            }
            return new Model.NamedTypeReference(names);
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
