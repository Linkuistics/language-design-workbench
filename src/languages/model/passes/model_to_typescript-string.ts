import { camelCase, pascalCase } from 'literal-case';
import {
    ArrayType,
    BooleanType,
    CharType,
    EnumType,
    ModelLanguage,
    NamedType,
    NamedTypeReference,
    OptionalType,
    ProductType,
    StringType,
    SumType,
    Type,
    VoidType
} from '../model';

export class ModelToTypescriptString {
    constructor(public useGenerics: boolean) {}

    transform(model: ModelLanguage): string {
        let typeNames = Array.from(model.namedTypes.keys());
        typeNames.sort();
        let definitionsSource = '';

        if (this.useGenerics) {
            definitionsSource += `type Optional<T> = T | undefined;\n\n`;
        }

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
        definitionsSource += '\n';
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
        return definitionsSource.trim();
    }

    private definitionSource(type: NamedType): string {
        if (type.type instanceof ProductType) {
            let result = '';
            if (type.type.fields.length === 0) {
                return `export class ${pascalCase(type.name)} {}\n\n`;
            }
            result += `export class ${pascalCase(type.name)} {\n    constructor(\n`;
            result += type.type.fields
                .map(
                    (field) =>
                        `        public ${camelCase(field.name)}: ${this.inlineSource(field.type)}`
                )
                .join(',\n');
            result += '\n    ) {}\n}\n\n';
            return result;
        } else if (type.type instanceof EnumType) {
            let result = '';
            result += `export enum ${pascalCase(type.name)} {\n`;
            result += type.type.members
                .map((member) => `    ${pascalCase(member)}`)
                .join(',\n');
            result += `\n}\n\n`;
            return result;
        } else {
            return `export type ${pascalCase(type.name)} = ${this.inlineSource(type.type)};\n`;
        }
    }

    private inlineSource(type: Type): string {
        if (type instanceof NamedTypeReference) {
            return pascalCase(type.target.name);
        } else if (type instanceof ArrayType) {
            if (this.useGenerics) {
                return `Array<${this.inlineSource(type.elementType)}>`;
            } else {
                if (
                    type.elementType instanceof SumType ||
                    type.elementType instanceof OptionalType
                ) {
                    return `(${this.inlineSource(type.elementType)})[]`;
                } else {
                    return `${this.inlineSource(type.elementType)}[]`;
                }
            }
        } else if (type instanceof OptionalType) {
            if (this.useGenerics) {
                return `Optional<${this.inlineSource(type.elementType)}>`;
            } else {
                return `${this.inlineSource(type.elementType)} | undefined`;
            }
        } else if (type instanceof ProductType) {
            let result = '';
            result += `{ `;
            result += type.fields
                .map(
                    (field) =>
                        `${camelCase(field.name)}: ${this.inlineSource(field.type)}`
                )
                .join(', ');
            result += ' }';
            return result;
        } else if (type instanceof SumType) {
            return type.members
                .map((member) => this.inlineSource(member))
                .join(' | ');
        } else if (type instanceof CharType) {
            return 'string';
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
