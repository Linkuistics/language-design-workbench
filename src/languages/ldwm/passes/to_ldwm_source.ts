import { camelCase, pascalCase } from 'literal-case';
import {
    ArrayType,
    BooleanType,
    EnumType,
    Model,
    NamedType,
    NamedTypeReference,
    OptionalType,
    ProductType,
    StringType,
    SumType,
    Type,
    VoidType
} from '../model';

export class ModelToModelString {
    constructor() {}

    transform(model: Model): string {
        let typeNames = Array.from(model.namedTypes.keys());
        typeNames.sort();
        let definitionsSource = `model ${model.name} {\n\n`;

        for (const typeName of typeNames) {
            const definition = model.namedTypes.get(typeName)!;
            if (
                !(
                    definition.type instanceof EnumType ||
                    definition.type instanceof ProductType
                )
            ) {
                definitionsSource += this.definitionSource(definition);
            }
        }
        for (const typeName of typeNames) {
            const definition = model.namedTypes.get(typeName)!;
            if (definition.type instanceof EnumType) {
                definitionsSource += this.definitionSource(definition);
            }
        }
        for (const typeName of typeNames) {
            const definition = model.namedTypes.get(typeName)!;
            if (definition.type instanceof ProductType) {
                definitionsSource += this.definitionSource(definition);
            }
        }
        return definitionsSource.trim() + '\n\n}\n';
    }

    private definitionSource(type: NamedType): string {
        return `    ${escapeName(type.name)} = ${this.source(type.type)};\n\n`;
    }

    private source(type: Type): string {
        if (type instanceof ProductType) {
            let result = '{ ';
            result += type.fields
                .map(
                    (field) =>
                        `${escapeName(field.name)}:${this.source(field.type)}`
                )
                .join(', ');
            result += ' }';
            return result;
        } else if (type instanceof EnumType) {
            let result = '';
            result += `{ `;
            result += type.members.map((member) => `"${member}"`).join(' | ');
            result += ` }`;
            return result;
        } else if (type instanceof SumType) {
            let result = `{ `;
            result += type.members
                .map((member) => `${this.source(member)}`)
                .join(' | ');
            result += ` }`;
            return result;
        } else if (type instanceof NamedTypeReference) {
            return escapeName(type.target.name);
        } else if (type instanceof OptionalType) {
            return `optional<${this.source(type.elementType)}>`;
        } else if (type instanceof ArrayType) {
            return `seq<${this.source(type.elementType)}>`;
        } else if (type instanceof StringType) {
            return 'string';
        } else if (type instanceof BooleanType) {
            return 'boolean';
        } else if (type instanceof VoidType) {
            return 'void';
        }
        throw new Error('Unexpected type: ' + type);
    }
}

function escapeName(name: string): string {
    return reservedWords.includes(name) ? `%${name}` : name;
}
const reservedWords = [
    'string',
    'boolean',
    'void',
    'i8',
    'i16',
    'i32',
    'i64',
    'u8',
    'u16',
    'u32',
    'u64',
    'f32',
    'f64'
];
