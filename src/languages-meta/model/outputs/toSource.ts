import { IndentingOutputStream } from '../../../output/indentingOutputStream';
import {
    Definition,
    Deletion,
    EnumType,
    MapType,
    MemberDeletion,
    MemberModification,
    Model,
    NamedTypeReference,
    OptionType,
    PrimitiveType,
    ProductMember,
    ProductType,
    SequenceType,
    SetType,
    SumType,
    TupleType,
    VoidType
} from '../model';
import { TraverseDelegate, Traverser } from '../traverser';

export class ModelToSource implements TraverseDelegate {
    private output: IndentingOutputStream;

    constructor() {
        this.output = new IndentingOutputStream();
    }

    transform(model: Model): string {
        this.output.write(`model ${model.name}`);
        if (model.parentName) {
            this.output.write(` modifies ${model.parentName}`);
        }
        this.output.writeLine(' {');
        this.output.writeLine();

        this.output.indentDuring(() => {
            const traverser = new Traverser(this);
            traverser.visitModel(model);
        });

        this.output.writeLine('}');

        const result = this.output.toString();
        return result;
    }

    visitModel(model: Model, traverser: Traverser) {
        model.values.forEach((value, index) => {
            if (value instanceof Definition) {
                this.visitDefinition(value, traverser);
            } else if (value instanceof Deletion) {
                this.visitDeletion(value);
            } else if (value instanceof MemberModification) {
                this.visitMemberModification(value, traverser);
            }
        });
    }

    visitDefinition(definition: Definition, traverser: Traverser) {
        this.output.write(`${definition.name} = `);
        traverser.visitType(definition.type);
        this.output.writeLine(';');
        this.output.writeLine();
    }

    visitDeletion(deletion: Deletion) {
        this.output.writeLine(`delete ${deletion.name};`);
        this.output.writeLine();
    }

    visitMemberModification(memberModification: MemberModification, traverser: Traverser) {
        this.output.writeLine(`modify ${memberModification.name} {`);
        this.output.indentDuring(() => {
            memberModification.values.forEach((value) => {
                if (value instanceof MemberDeletion) {
                    this.output.write('-= ');
                    this.output.writeLine(Array.isArray(value.name) ? value.name.join('::') : value.name.toString());
                } else {
                    this.output.write('+= ');
                    if (value.value instanceof ProductMember) {
                        this.output.write(`${value.value.name}: `);
                        traverser.visitType(value.value.type);
                    } else {
                        traverser.visitType(value.value);
                    }
                    this.output.writeLine();
                }
            });
        });
        this.output.writeLine('};');
        this.output.writeLine();
    }

    visitVoidType(voidType: VoidType) {
        this.output.write('()');
    }

    visitPrimitiveType(primitiveType: PrimitiveType) {
        this.output.write(primitiveType);
    }

    visitEnumType(enumType: EnumType) {
        if (enumType.members.length > 1) {
            this.output.writeLine('{');
            this.output.indentDuring(() => {
                this.output.joinLinesPrefixing(enumType.members, '| ', (member) => this.output.write(`"${member}"`));
            });
            this.output.write('}');
        } else {
            this.output.write('{ ');
            this.output.join(enumType.members, ' | ', (member) => this.output.write(`"${member}"`));
            this.output.write(' }');
        }
    }

    visitSumType(sumType: SumType, traverser: Traverser) {
        if (sumType.members.length > 1) {
            this.output.writeLine('{');
            this.output.indentDuring(() => {
                this.output.joinLinesPrefixing(sumType.members, '| ', (member) => traverser.visitType(member));
            });
            this.output.write('}');
        } else {
            this.output.write('{ ');
            this.output.join(sumType.members, ' | ', (member) => traverser.visitType(member));
            this.output.write(' }');
        }
    }

    visitProductType(productType: ProductType, traverser: Traverser) {
        if (productType.members.length > 1) {
            this.output.writeLine('{');
            this.output.indentDuring(() => {
                this.output.joinLinesSeparating(productType.members, ',', (member) => {
                    this.output.write(`${member.name}: `);
                    traverser.visitType(member.type);
                });
            });
            this.output.write('}');
        } else {
            this.output.write('{ ');
            this.output.join(productType.members, ', ', (member) => {
                this.output.write(`${member.name}: `);
                traverser.visitType(member.type);
            });
            this.output.write(' }');
        }
    }

    visitTupleType(tupleType: TupleType, traverser: Traverser) {
        this.output.write('tuple<');
        this.output.join(tupleType.members, ', ', (member) => traverser.visitType(member));
        this.output.write('>');
    }

    visitMapType(mapType: MapType, traverser: Traverser) {
        this.output.write('map<');
        traverser.visitType(mapType.keyType);
        this.output.write(', ');
        traverser.visitType(mapType.valueType);
        this.output.write('>');
    }

    visitSetType(setType: SetType, traverser: Traverser) {
        this.output.write('set<');
        traverser.visitType(setType.keyType);
        this.output.write('>');
    }

    visitSequenceType(sequenceType: SequenceType, traverser: Traverser) {
        this.output.write('seq<');
        traverser.visitType(sequenceType.elementType);
        this.output.write('>');
    }

    visitOptionType(optionType: OptionType, traverser: Traverser) {
        this.output.write('option<');
        traverser.visitType(optionType.type);
        this.output.write('>');
    }

    visitNamedTypeReference(namedTypeReference: NamedTypeReference) {
        this.output.write(namedTypeReference.names.join('::'));
    }
}
