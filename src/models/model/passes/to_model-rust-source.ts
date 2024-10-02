import { camelCase, pascalCase } from 'literal-case';
import {
    Definition,
    EnumType,
    MapType,
    Model,
    NamedTypeReference,
    OptionType,
    PrimitiveType,
    ProductType,
    ResultType,
    SequenceType,
    SetType,
    SumType,
    TupleType,
    VoidType
} from '../model';
import { TraverseDelegate, Traverser } from '../traverser';

export class ToModelRustSource implements TraverseDelegate {
    private definitionsSource =
        'type OptionType<T> = T | undefined;\n' +
        'type ResultType<O, E> = O | { error: E }\n' +
        '\n\n';

    constructor(public useGenerics: boolean) {}

    transform(model: Model): string {
        new Traverser(this).visitModel(model);

        return this.definitionsSource.trim();
    }

    visitDefinition(definition: Definition, traverser: Traverser): Definition {
        if (definition.type instanceof ProductType) {
            this.definitionsSource += `export class ${pascalCase(definition.name)} {\n`;
            if (definition.type.members.length > 0) {
                this.definitionsSource += '    constructor(\n';
                for (let i = 0; i < definition.type.members.length; i++) {
                    if (0 < i) this.definitionsSource += ',\n';
                    const member = definition.type.members[i];
                    this.definitionsSource += `        public ${camelCase(member.name)}:`;
                    traverser.visitType(member.type);
                }
                this.definitionsSource += `\n    ) {}\n`;
            }
            this.definitionsSource += `}\n\n`;
        } else if (definition.type instanceof EnumType) {
            this.definitionsSource += `export enum ${pascalCase(definition.name)} {`;
            for (let i = 0; i < definition.type.members.length; i++) {
                const member = definition.type.members[i];
                this.definitionsSource += `    ${pascalCase(member)},`;
            }
            this.definitionsSource += `}\n\n`;
        } else {
            this.definitionsSource += `export type ${pascalCase(definition.name)} =`;
            traverser.visitType(definition.type);
            this.definitionsSource += `;\n\n`;
        }

        return definition;
    }

    visitVoidType(voidType: VoidType): VoidType {
        this.definitionsSource += 'void';
        return voidType;
    }

    visitPrimitiveType(primitiveType: PrimitiveType): PrimitiveType {
        switch (primitiveType) {
            case 'boolean':
                this.definitionsSource += 'boolean';
                break;
            case 'char':
                this.definitionsSource += 'string';
                break;
            case 'string':
                this.definitionsSource += 'string';
                break;
            case 'i8':
                this.definitionsSource += 'number';
                break;
            case 'i16':
                this.definitionsSource += 'number';
                break;
            case 'i32':
                this.definitionsSource += 'number';
                break;
            case 'i64':
                this.definitionsSource += 'number';
                break;
            case 'u8':
                this.definitionsSource += 'number';
                break;
            case 'u16':
                this.definitionsSource += 'number';
                break;
            case 'u32':
                this.definitionsSource += 'number';
                break;
            case 'u64':
                this.definitionsSource += 'number';
                break;
            case 'f32':
                this.definitionsSource += 'number';
                break;
            case 'f64':
                this.definitionsSource += 'number';
                break;
        }
        return primitiveType;
    }

    visitEnumType(enumType: EnumType): EnumType {
        for (let i = 0; i < enumType.members.length; i++) {
            if (0 < i) this.definitionsSource += ' | ';
            this.definitionsSource += `"${pascalCase(enumType.members[i])}"`;
        }
        return enumType;
    }

    visitSumType(sumType: SumType, traverser: Traverser): SumType {
        for (let i = 0; i < sumType.members.length; i++) {
            if (0 < i) this.definitionsSource += ' | ';
            const member = sumType.members[i];
            traverser.visitType(member);
        }
        return sumType;
    }

    visitProductType(
        productType: ProductType,
        traverser: Traverser
    ): ProductType {
        this.definitionsSource += `{ `;
        for (let i = 0; i < productType.members.length; i++) {
            if (0 < i) this.definitionsSource += ', ';
            const member = productType.members[i];
            this.definitionsSource += `${camelCase(member.name)}:`;
            traverser.visitType(member.type);
        }
        this.definitionsSource += ` }`;
        return productType;
    }

    visitTupleType(tupleType: TupleType, traverser: Traverser): TupleType {
        this.definitionsSource += `[`;
        tupleType.members.forEach((member, index) => {
            traverser.visitType(member);
            if (index < tupleType.members.length - 1) {
                this.definitionsSource += ', ';
            }
        });
        this.definitionsSource += `]`;
        return tupleType;
    }

    visitMapType(mapType: MapType, traverser: Traverser): MapType {
        this.definitionsSource += `Map<`;
        traverser.visitType(mapType.keyType);
        this.definitionsSource += ', ';
        traverser.visitType(mapType.valueType);
        this.definitionsSource += `>`;
        return mapType;
    }

    visitSetType(setType: SetType, traverser: Traverser): SetType {
        this.definitionsSource += `Set<`;
        traverser.visitType(setType.keyType);
        this.definitionsSource += `>`;
        return setType;
    }

    visitSequenceType(
        sequenceType: SequenceType,
        traverser: Traverser
    ): SequenceType {
        this.definitionsSource += `Array<`;
        traverser.visitType(sequenceType.elementType);
        this.definitionsSource += `>`;
        return sequenceType;
    }

    visitOptionType(optionType: OptionType, traverser: Traverser): OptionType {
        this.definitionsSource += `Option<`;
        traverser.visitType(optionType.type);
        this.definitionsSource += `>`;
        return optionType;
    }

    visitResultType(resultType: ResultType, traverser: Traverser): ResultType {
        this.definitionsSource += `Result<`;
        traverser.visitType(resultType.okType);
        this.definitionsSource += ', ';
        traverser.visitType(resultType.errType);
        this.definitionsSource += `>`;
        return resultType;
    }

    visitNamedTypeReference(
        namedTypeReference: NamedTypeReference
    ): NamedTypeReference {
        this.definitionsSource += pascalCase(
            namedTypeReference.names[namedTypeReference.names.length - 1]
        );
        return namedTypeReference;
    }
}
