import { camelCase, pascalCase } from 'literal-case';
import { IndentingOutputStream } from '../../../../../output/indentingOutputStream';
import {
    Definition,
    EnumType,
    MapType,
    Model,
    NamedTypeReference,
    OptionType,
    PrimitiveType,
    ProductType,
    SequenceType,
    SetType,
    SumType,
    TupleType,
    VoidType
} from '../model';
import { Visitor } from '../visitor';

export class ParsedModelToTypesTypescriptSource extends Visitor {
    private output: IndentingOutputStream;

    constructor(public useGenerics: boolean) {
        super();
        this.output = new IndentingOutputStream();
    }

    transform(model: Model): string {
        if (this.useGenerics) {
            this.output.writeLine('type Option<T> = T | undefined;');
            this.output.writeLine();
        }
        this.visitModel(model);

        return this.output.toString().trim();
    }

    visitDefinition(definition: Definition) {
        if (definition.type instanceof ProductType) {
            this.output.writeLine(`export class ${pascalCase(definition.name)} {`);
            this.output.indentDuring(() => {
                const productType = definition.type as ProductType;
                if (productType.members.length > 0) {
                    this.output.writeLine('constructor(');
                    this.output.indentDuring(() => {
                        this.output.join(productType.members, ',\n', (member) => {
                            this.output.write(`public ${camelCase(member.name)}: `);
                            this.visitType(member.type);
                        });
                        this.output.writeLine();
                    });
                    this.output.writeLine(') {}');
                }
            });
            this.output.writeLine('}');
        } else if (definition.type instanceof EnumType) {
            this.output.writeLine(`export enum ${pascalCase(definition.name)} {`);
            this.output.indentDuring(() => {
                const enumType = definition.type as EnumType;
                this.output.join(enumType.members, ',\n', (member, index) => {
                    this.output.write(`${pascalCase(member)} = ${index + 1}`);
                });
                this.output.writeLine();
            });
            this.output.writeLine('}');
        } else {
            this.output.write(`export type ${pascalCase(definition.name)} = `);
            this.visitType(definition.type);
            this.output.writeLine(';');
        }
        this.output.writeLine();
    }

    visitVoidType(voidType: VoidType) {
        this.output.write('void');
    }

    visitPrimitiveType(primitiveType: PrimitiveType) {
        switch (primitiveType) {
            case PrimitiveType.Boolean:
                this.output.write('boolean');
                break;
            case PrimitiveType.Char:
            case PrimitiveType.String:
                this.output.write('string');
                break;
            default:
                this.output.write('number');
                break;
        }
    }

    visitEnumType(enumType: EnumType) {
        this.output.join(enumType.members, ' | ', (member) => {
            this.output.write(`"${pascalCase(member)}"`);
        });
    }

    visitSumType(sumType: SumType) {
        this.output.join(sumType.members, ' | ', (member) => {
            this.visitType(member);
        });
    }

    visitProductType(productType: ProductType) {
        this.output.write('{ ');
        this.output.join(productType.members, ', ', (member) => {
            this.output.write(`${camelCase(member.name)}: `);
            this.visitType(member.type);
        });
        this.output.write(' }');
    }

    visitTupleType(tupleType: TupleType) {
        this.output.write('[');
        this.output.join(tupleType.members, ', ', (member) => {
            this.visitType(member);
        });
        this.output.write(']');
    }

    visitMapType(mapType: MapType) {
        this.output.write('Map<');
        this.visitType(mapType.keyType);
        this.output.write(', ');
        this.visitType(mapType.valueType);
        this.output.write('>');
    }

    visitSetType(setType: SetType) {
        this.output.write('Set<');
        this.visitType(setType.keyType);
        this.output.write('>');
    }

    visitSequenceType(sequenceType: SequenceType) {
        if (this.useGenerics) {
            this.output.write('Array<');
            this.visitType(sequenceType.elementType);
            this.output.write('>');
        } else {
            if (sequenceType.elementType instanceof OptionType || sequenceType.elementType instanceof SumType) {
                this.output.write('(');
                this.visitType(sequenceType.elementType);
                this.output.write(')');
            } else {
                this.visitType(sequenceType.elementType);
            }
            this.output.write('[]');
        }
    }

    visitOptionType(optionType: OptionType) {
        if (this.useGenerics) {
            this.output.write('Option<');
            this.visitType(optionType.type);
            this.output.write('>');
        } else {
            this.visitType(optionType.type);
            this.output.write(' | undefined');
        }
    }

    visitNamedTypeReference(namedTypeReference: NamedTypeReference) {
        this.output.write(pascalCase(namedTypeReference.names[namedTypeReference.names.length - 1]));
    }
}
