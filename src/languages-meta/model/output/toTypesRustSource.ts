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

export class ModelToTypesRustSource implements TraverseDelegate {
    private output: IndentingOutputStream;

    constructor() {
        this.output = new IndentingOutputStream();
    }

    transform(model: Model): string {
        new Traverser(this).visitModel(model);
        return this.output.toString().trim();
    }

    visitDefinition(definition: Definition, traverser: Traverser) {
        if (definition.type instanceof ProductType) {
            this.output.writeLine(`pub struct ${pascalCase(definition.name)} {`);
            this.output.indentDuring(() => {
                const productType = definition.type as ProductType;
                if (productType.members.length > 0) {
                    this.output.join(productType.members, ', ', (member) => {
                        this.output.write(`pub r#${camelCase(member.name)}: `);
                        traverser.visitType(member.type);
                    });
                }
            });
            this.output.writeLine('}');
        } else if (definition.type instanceof EnumType) {
            this.output.writeLine(`pub enum ${pascalCase(definition.name)} {`);
            this.output.indentDuring(() => {
                const enumType = definition.type as EnumType;
                this.output.join(enumType.members, ', ', (member) => {
                    this.output.write(`${pascalCase(member)}`);
                });
                this.output.writeLine();
            });
            this.output.writeLine('}');
            // } else if (definition.type instanceof SumType) {
            //     this.output.writeLine(`pub enum ${pascalCase(definition.name)} {`);
            //     this.output.indentDuring(() => {
            //         const enumType = definition.type as SumType;
            //         this.output.join(enumType.members, ', ', (member) => {
            //             this.output.write(`${pascalCase(member)}(${pascalCase(member)})`);
            //         });
            //         this.output.writeLine();
            //     });
            //     this.output.writeLine('}');
        } else {
            this.output.write(`pub type ${pascalCase(definition.name)} = `);
            traverser.visitType(definition.type);
            this.output.writeLine(';');
        }
        this.output.writeLine();
    }

    visitVoidType(voidType: VoidType) {
        this.output.write('()');
    }

    visitPrimitiveType(primitiveType: PrimitiveType) {
        switch (primitiveType) {
            case 'string':
                this.output.write('String');
                break;
            default:
                this.output.write(primitiveType);
                break;
        }
    }

    visitEnumType(enumType: EnumType) {
        this.output.write('()');
        // this.output.join(enumType.members, ' | ', (member) => {
        //     this.output.write(`"${pascalCase(member)}"`);
        // });
    }

    visitSumType(sumType: SumType, traverser: Traverser) {
        this.output.write('()');
        // this.output.join(sumType.members, ' | ', (member) => {
        //     traverser.visitType(member);
        // });
    }

    visitProductType(productType: ProductType, traverser: Traverser) {
        this.output.write('()');
        // this.output.write('{ ');
        // this.output.join(productType.members, ', ', (member) => {
        //     this.output.write(`${camelCase(member.name)}: `);
        //     traverser.visitType(member.type);
        // });
        // this.output.write(' }');
    }

    visitTupleType(tupleType: TupleType, traverser: Traverser) {
        this.output.write('()');
        // this.output.write('[');
        // this.output.join(tupleType.members, ', ', (member) => {
        //     traverser.visitType(member);
        // });
        // this.output.write(']');
    }

    visitMapType(mapType: MapType, traverser: Traverser) {
        this.output.write('std::collections::HashMap<');
        traverser.visitType(mapType.keyType);
        this.output.write(', ');
        traverser.visitType(mapType.valueType);
        this.output.write('>');
    }

    visitSetType(setType: SetType, traverser: Traverser) {
        this.output.write('std::collections::HashSet<');
        traverser.visitType(setType.keyType);
        this.output.write('>');
    }

    visitSequenceType(sequenceType: SequenceType, traverser: Traverser) {
        this.output.write('Vec<');
        traverser.visitType(sequenceType.elementType);
        this.output.write('>');
    }

    visitOptionType(optionType: OptionType, traverser: Traverser) {
        this.output.write('Option<');
        traverser.visitType(optionType.type);
        this.output.write('>');
    }

    visitNamedTypeReference(namedTypeReference: NamedTypeReference) {
        this.output.write(pascalCase(namedTypeReference.names[namedTypeReference.names.length - 1]));
    }
}
