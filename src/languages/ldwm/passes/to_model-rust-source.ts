import { assert } from 'console';
import { pascalCase, snakeCase } from 'literal-case';
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

export class ToModelRustSource {
    transform(model: Model): string {
        let typeNames = Array.from(model.namedTypes.keys());
        typeNames.sort();
        let definitionsSource = '';
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
        return definitionsSource.trim();
    }

    private definitionSource(type: NamedType): string {
        if (type.type instanceof SumType) {
            let result = '';
            result += `pub enum ${pascalCase(type.name)} {\n`;
            for (const member of type.type.members) {
                assert(member instanceof NamedTypeReference);
                const name = pascalCase(
                    (member as NamedTypeReference).target.name
                );
                result += `    ${name}(${name}),\n`;
            }
            result += `}\n\n`;
            return result;
        } else if (type.type instanceof ProductType) {
            let result = '';
            result += `pub struct ${pascalCase(type.name)} {\n`;
            result += type.type.fields
                .map(
                    (field) =>
                        `    pub ${snakeCase(field.name)}: ${this.inlineSource(field.type)}`
                )
                .join(',\n');
            result += '\n}\n\n';
            return result;
        } else if (type.type instanceof EnumType) {
            let result = '';
            result += `pub enum ${pascalCase(type.name)} {\n`;
            result += type.type.members
                .map((member) => `    ${pascalCase(member)}`)
                .join(',\n');
            result += `\n}\n\n`;
            return result;
        } else {
            return `pub type ${pascalCase(type.name)} = ${this.inlineSource(type.type)};\n\n`;
        }
    }

    private inlineSource(type: Type): string {
        if (type instanceof NamedTypeReference) {
            return pascalCase(type.target.name);
        } else if (type instanceof ArrayType) {
            return `Vec<${this.inlineSource(type.elementType)}>`;
        } else if (type instanceof OptionalType) {
            return `Option<${this.inlineSource(type.elementType)}>`;
        } else if (type instanceof SumType) {
            let result = type.members
                .map((member) => this.inlineSource(member))
                .join(' | ');
            return `() /* ${result} */`;
        } else if (type instanceof ProductType) {
            let result = '';
            result += `{ `;
            result += type.fields
                .map(
                    (field) =>
                        `${snakeCase(field.name)}: ${this.inlineSource(field.type)}`
                )
                .join(', ');
            result += '}';
            return `() /* ${result} */`;
        } else if (type instanceof StringType) {
            return 'String';
        } else if (type instanceof BooleanType) {
            return 'bool';
        } else if (type instanceof VoidType) {
            return '()';
        }
        throw new Error('Unexpected type: ' + type);
    }
}
