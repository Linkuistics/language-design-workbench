import { camelCase, pascalCase } from 'literal-case';
import {
    Model,
    Definition,
    Deletion,
    MemberModification,
    Type,
    VoidType,
    PrimitiveType,
    EnumType,
    SumType,
    ProductType,
    TupleType,
    MapType,
    SetType,
    SequenceType,
    OptionType,
    ResultType,
    NamedTypeReference,
    MemberDeletion,
    MemberAddition,
    ProductMember
} from '../new-model';
import { TraverseDelegate, Traverser } from '../new-traverser';
import { IndentingOutputStream } from '../../../output/indenting_output_stream';

export class ToLDWMSource implements TraverseDelegate {
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

        return this.output.toString();
    }

    visitModel(model: Model, traverser: Traverser): Model {
        model.values.forEach((value) => {
            if (value instanceof Definition) {
                this.visitDefinition(value, traverser);
            } else if (value instanceof Deletion) {
                this.visitDeletion(value);
            } else if (value instanceof MemberModification) {
                this.visitMemberModification(value, traverser);
            }
        });
        return model;
    }

    visitDefinition(definition: Definition, traverser: Traverser): Definition {
        this.output.write(`${definition.name} = `);
        traverser.visitType(definition.type);
        this.output.writeLine(';');
        this.output.writeLine();
        return definition;
    }

    visitDeletion(deletion: Deletion): Deletion {
        this.output.writeLine(`delete ${deletion.name};`);
        this.output.writeLine();
        return deletion;
    }

    visitMemberModification(
        memberModification: MemberModification,
        traverser: Traverser
    ): MemberModification {
        this.output.writeLine(`modify ${memberModification.name} {`);
        this.output.indentDuring(() => {
            memberModification.values.forEach((value) => {
                if (this.isMemberDeletion(value)) {
                    this.output.write('-= ');
                    this.output.writeLine(
                        Array.isArray(value.name)
                            ? value.name.join('::')
                            : value.name.toString()
                    );
                } else if (this.isMemberAddition(value)) {
                    this.output.write('+= ');
                    if (this.isProductMember(value.value)) {
                        this.output.write(`${value.value.name}: `);
                        traverser.visitType(value.value.type);
                    } else {
                        traverser.visitType(value.value);
                    }
                    this.output.writeLine();
                }
            });
        });
        this.output.writeLine('}');
        this.output.writeLine();
        return memberModification;
    }

    visitVoidType(voidType: VoidType): VoidType {
        this.output.write('()');
        return voidType;
    }

    visitPrimitiveType(primitiveType: PrimitiveType): PrimitiveType {
        this.output.write(primitiveType);
        return primitiveType;
    }

    visitEnumType(enumType: EnumType): EnumType {
        this.output.write('{ ');
        this.output.writeJoined(enumType.members, ' | ', (member) =>
            this.output.write(`"${member}"`)
        );
        this.output.write(' }');
        return enumType;
    }

    visitSumType(sumType: SumType, traverser: Traverser): SumType {
        this.output.write('{ ');
        this.output.writeJoined(sumType.members, ' | ', (member) =>
            traverser.visitType(member)
        );
        this.output.write(' }');
        return sumType;
    }

    visitProductType(
        productType: ProductType,
        traverser: Traverser
    ): ProductType {
        this.output.write('{ ');
        this.output.writeJoined(productType.members, ', ', (member) => {
            this.output.write(`${member.name}: `);
            traverser.visitType(member.type);
        });
        this.output.write(' }');
        return productType;
    }

    visitTupleType(tupleType: TupleType, traverser: Traverser): TupleType {
        this.output.write('tuple<');
        this.output.writeJoined(tupleType.members, ', ', (member) =>
            traverser.visitType(member)
        );
        this.output.write('>');
        return tupleType;
    }

    visitMapType(mapType: MapType, traverser: Traverser): MapType {
        this.output.write('map<');
        traverser.visitType(mapType.keyType);
        this.output.write(', ');
        traverser.visitType(mapType.valueType);
        this.output.write('>');
        return mapType;
    }

    visitSetType(setType: SetType, traverser: Traverser): SetType {
        this.output.write('set<');
        traverser.visitType(setType.keyType);
        this.output.write('>');
        return setType;
    }

    visitSequenceType(
        sequenceType: SequenceType,
        traverser: Traverser
    ): SequenceType {
        this.output.write('seq<');
        traverser.visitType(sequenceType.elementType);
        this.output.write('>');
        return sequenceType;
    }

    visitOptionType(optionType: OptionType, traverser: Traverser): OptionType {
        this.output.write('option<');
        traverser.visitType(optionType.type);
        this.output.write('>');
        return optionType;
    }

    visitResultType(resultType: ResultType, traverser: Traverser): ResultType {
        this.output.write('result<');
        traverser.visitType(resultType.okType);
        this.output.write(', ');
        traverser.visitType(resultType.errType);
        this.output.write('>');
        return resultType;
    }

    visitNamedTypeReference(
        namedTypeReference: NamedTypeReference
    ): NamedTypeReference {
        this.output.write(namedTypeReference.names.join('::'));
        return namedTypeReference;
    }

    private isMemberDeletion(
        value: MemberDeletion | MemberAddition
    ): value is MemberDeletion {
        return 'name' in value;
    }

    private isMemberAddition(
        value: MemberDeletion | MemberAddition
    ): value is MemberAddition {
        return 'value' in value;
    }

    private isProductMember(
        value: Type | ProductMember
    ): value is ProductMember {
        return typeof value === 'object' && 'name' in value && 'type' in value;
    }
}
