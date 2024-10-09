import { camelCase, pascalCase } from 'literal-case';
import { IndentingOutputStream } from '../../../output/indentingOutputStream';
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
import { TraverseDelegate, Traverser } from '../traverser';

export class ModelToTypesTypescriptSource implements TraverseDelegate {
    private output: IndentingOutputStream;

    constructor(public useGenerics: boolean) {
        this.output = new IndentingOutputStream();
    }

    transform(model: Model): string {
        if (this.useGenerics) {
            this.output.writeLine('type Option<T> = T | undefined;');
            this.output.writeLine();
        }
        new Traverser(this).visitModel(model);

        return this.output.toString().trim();
    }

    visitDefinition(definition: Definition, traverser: Traverser) {
        if (definition.type instanceof ProductType) {
            this.output.writeLine(`export class ${pascalCase(definition.name)} {`);
            this.output.indentDuring(() => {
                const productType = definition.type as ProductType;
                if (productType.members.length > 0) {
                    this.output.writeLine('constructor(');
                    this.output.indentDuring(() => {
                        this.output.join(productType.members, ',\n', (member) => {
                            this.output.write(`public ${camelCase(member.name)}: `);
                            traverser.visitType(member.type);
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
            traverser.visitType(definition.type);
            this.output.writeLine(';');
        }
        this.output.writeLine();
    }

    visitVoidType(voidType: VoidType) {
        this.output.write('void');
    }

    visitPrimitiveType(primitiveType: PrimitiveType) {
        switch (primitiveType) {
            case 'boolean':
                this.output.write('boolean');
                break;
            case 'char':
            case 'string':
                this.output.write('string');
                break;
            case 'i8':
            case 'i16':
            case 'i32':
            case 'i64':
            case 'u8':
            case 'u16':
            case 'u32':
            case 'u64':
            case 'f32':
            case 'f64':
                this.output.write('number');
                break;
        }
    }

    visitEnumType(enumType: EnumType) {
        this.output.join(enumType.members, ' | ', (member) => {
            this.output.write(`"${pascalCase(member)}"`);
        });
    }

    visitSumType(sumType: SumType, traverser: Traverser) {
        this.output.join(sumType.members, ' | ', (member) => {
            traverser.visitType(member);
        });
    }

    visitProductType(productType: ProductType, traverser: Traverser) {
        this.output.write('{ ');
        this.output.join(productType.members, ', ', (member) => {
            this.output.write(`${camelCase(member.name)}: `);
            traverser.visitType(member.type);
        });
        this.output.write(' }');
    }

    visitTupleType(tupleType: TupleType, traverser: Traverser) {
        this.output.write('[');
        this.output.join(tupleType.members, ', ', (member) => {
            traverser.visitType(member);
        });
        this.output.write(']');
    }

    visitMapType(mapType: MapType, traverser: Traverser) {
        this.output.write('Map<');
        traverser.visitType(mapType.keyType);
        this.output.write(', ');
        traverser.visitType(mapType.valueType);
        this.output.write('>');
    }

    visitSetType(setType: SetType, traverser: Traverser) {
        this.output.write('Set<');
        traverser.visitType(setType.keyType);
        this.output.write('>');
    }

    visitSequenceType(sequenceType: SequenceType, traverser: Traverser) {
        if (this.useGenerics) {
            this.output.write('Array<');
            traverser.visitType(sequenceType.elementType);
            this.output.write('>');
        } else {
            if (sequenceType.elementType instanceof OptionType || sequenceType.elementType instanceof SumType) {
                this.output.write('(');
                traverser.visitType(sequenceType.elementType);
                this.output.write(')');
            } else {
                traverser.visitType(sequenceType.elementType);
            }
            this.output.write('[]');
        }
    }

    visitOptionType(optionType: OptionType, traverser: Traverser) {
        if (this.useGenerics) {
            this.output.write('Option<');
            traverser.visitType(optionType.type);
            this.output.write('>');
        } else {
            traverser.visitType(optionType.type);
            this.output.write(' | undefined');
        }
    }

    visitNamedTypeReference(namedTypeReference: NamedTypeReference) {
        this.output.write(pascalCase(namedTypeReference.names[namedTypeReference.names.length - 1]));
    }
}
