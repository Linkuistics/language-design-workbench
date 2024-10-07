import { InputStream } from '../../parser/inputStream';
import * as Model from './model';
import { Parser } from '../../parser/parser';

type TriviaKind = 'LineComment' | 'BlockComment' | 'Whitespace';
type Id = string;

export class ModelParser extends Parser {
    constructor(input: InputStream) {
        super(input);
    }

    parseModel(): Model.Model {
        return this.withContext('model', () => {
            let name;
            let parentName;
            const values = [];

            this.mustConsumeKeyword('model');
            name = this.parseId();

            if (this.consumeKeyword('modifies')) {
                parentName = this.parseId();
            }

            this.mustConsumeString('{');

            while (!this.consumeString('}')) {
                values.push(
                    this.firstAlternative(
                        'model element',
                        () => this.parseDeletion(),
                        () => this.parseMemberModification(),
                        () => this.parseDefinition()
                    )
                );

                this.mustConsumeString(';');
            }

            return new Model.Model(name, parentName, values);
        });
    }

    parseDefinition(): Model.Definition {
        return this.withContext('definition', () => {
            let name;
            let type;

            name = this.parseId();
            this.mustConsumeString('=');
            type = this.parseType();

            return new Model.Definition(name, type);
        });
    }

    parseDeletion(): Model.Deletion {
        let name;

        this.mustConsumeKeyword('delete');
        name = this.parseId();

        return new Model.Deletion(name);
    }

    parseMemberModification(): Model.MemberModification {
        let name;
        const values = [];

        this.mustConsumeKeyword('modify');
        name = this.parseId();
        this.mustConsumeString('{');
        do {
            values.push(
                this.firstAlternative(
                    'member modification element',
                    () => this.parseMemberDeletion(),
                    () => this.parseMemberAddition()
                )
            );
        } while (!this.consumeString('}'));

        return new Model.MemberModification(name, values);
    }

    parseMemberDeletion(): Model.MemberDeletion {
        let name;

        this.mustConsumeString('-=');
        name = this.parseId();

        return new Model.MemberDeletion(name);
    }

    parseMemberAddition(): Model.MemberAddition {
        let value;

        this.mustConsumeString('+=');
        value = this.firstAlternative(
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
            const members = [];

            this.mustConsumeString('{');
            members.push(this.parseString());
            while (this.consumeString('|')) {
                members.push(this.parseString());
            }
            this.mustConsumeString('}');

            return new Model.EnumType(members);
        });
    }

    parseString(): string {
        let value;

        this.mustConsumeString('"');
        value = this.parseId();
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
            const members = [];

            this.mustConsumeString('{');
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
            const members: Model.ProductMember[] = [];

            this.mustConsumeString('{');
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
            let name;
            let type;

            name = this.parseId();
            this.mustConsumeString(':');
            type = this.parseType();

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
                () => this.parseOptionType()
            );
        });
    }

    parseTupleType(): Model.TupleType {
        const members: Model.Type[] = [];

        this.mustConsumeString('tuple<');
        members.push(this.parseType());
        while (this.consumeString(',')) {
            members.push(this.parseType());
        }
        this.mustConsumeString('>');

        return new Model.TupleType(members);
    }

    parseMapType(): Model.MapType {
        let keyType;
        let valueType;

        this.mustConsumeString('map<');
        keyType = this.parseType();
        this.mustConsumeString(',');
        valueType = this.parseType();
        this.mustConsumeString('>');

        return new Model.MapType(keyType, valueType);
    }

    parseSetType(): Model.SetType {
        let keyType;

        this.mustConsumeString('set<');
        keyType = this.parseType();
        this.mustConsumeString('>');

        return new Model.SetType(keyType);
    }

    parseSequenceType(): Model.SequenceType {
        let elementType;

        this.mustConsumeString('seq<');
        elementType = this.parseType();
        this.mustConsumeString('>');

        return new Model.SequenceType(elementType);
    }

    parseOptionType(): Model.OptionType {
        let type;

        this.mustConsumeString('option<');
        type = this.parseType();
        this.mustConsumeString('>');

        return new Model.OptionType(type);
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
