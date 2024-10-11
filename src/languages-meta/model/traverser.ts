import {
    BlockComment,
    Definition,
    Deletion,
    EnumType,
    GenericType,
    LineComment,
    MapType,
    MemberAddition,
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
    Trivia,
    TupleType,
    Type,
    TypeWithStructure,
    VoidType,
    Whitespace
} from './model';

type VisitorResult<T> = T | void;

export interface TraverseDelegate {
    visitModel?(model: Model, traverser: Traverser): VisitorResult<Model>;

    visitDefinition?(definition: Definition, traverser: Traverser): VisitorResult<Definition>;

    visitDeletion?(deletion: Deletion, traverser: Traverser): VisitorResult<Deletion>;
    visitMemberModification?(
        memberModification: MemberModification,
        traverser: Traverser
    ): VisitorResult<MemberModification>;
    visitMemberDeletion?(memberDeletion: MemberDeletion, traverser: Traverser): VisitorResult<MemberDeletion>;
    visitMemberAddition?(memberAddition: MemberAddition, traverser: Traverser): VisitorResult<MemberAddition>;

    visitType?(type: Type, traverser: Traverser): VisitorResult<Type>;
    visitVoidType?(voidType: VoidType, traverser: Traverser): VisitorResult<Type>;
    visitPrimitiveType?(primitiveType: PrimitiveType, traverser: Traverser): VisitorResult<Type>;
    visitEnumType?(enumType: EnumType, traverser: Traverser): VisitorResult<Type>;
    visitTypeWithStructure?(typeWithStructure: TypeWithStructure, traverser: Traverser): VisitorResult<Type>;
    visitNamedTypeReference?(namedTypeReference: NamedTypeReference, traverser: Traverser): VisitorResult<Type>;
    visitSumType?(sumType: SumType, traverser: Traverser): VisitorResult<Type>;
    visitProductType?(productType: ProductType, traverser: Traverser): VisitorResult<Type>;
    visitProductMember?(productMember: ProductMember, traverser: Traverser): VisitorResult<ProductMember>;
    visitGenericType?(genericType: GenericType, traverser: Traverser): VisitorResult<Type>;
    visitTupleType?(tupleType: TupleType, traverser: Traverser): VisitorResult<Type>;
    visitMapType?(mapType: MapType, traverser: Traverser): VisitorResult<Type>;
    visitSetType?(setType: SetType, traverser: Traverser): VisitorResult<Type>;
    visitSequenceType?(sequenceType: SequenceType, traverser: Traverser): VisitorResult<Type>;
    visitOptionType?(optionType: OptionType, traverser: Traverser): VisitorResult<Type>;

    visitTrivia?(trivia: Trivia, traverser: Traverser): VisitorResult<Trivia>;
    visitBlockComment?(blockComment: BlockComment, traverser: Traverser): VisitorResult<BlockComment>;
    visitLineComment?(lineComment: LineComment, traverser: Traverser): VisitorResult<LineComment>;
    visitWhitespace?(whitespace: Whitespace, traverser: Traverser): VisitorResult<Whitespace>;
}

export class Traverser {
    constructor(public delegate: TraverseDelegate) {}

    private visit<N>(node: N, visitorMethod: keyof TraverseDelegate, contentVisitor?: () => void): N {
        const visitor = this.delegate[visitorMethod] as
            | ((node: N, traverser: Traverser) => VisitorResult<N>)
            | undefined;
        if (visitor) {
            return visitor.call(this.delegate, node, this) ?? node;
        } else {
            contentVisitor?.();
            return node;
        }
    }

    visitModel(model: Model): Model {
        return this.visit(model, 'visitModel', () => this.visitModelContent(model));
    }

    visitModelContent(model: Model) {
        model.values = model.values.map((value) => this.dispatchModelValue(value));
    }

    dispatchModelValue(value: Definition | Deletion | MemberModification): Definition | Deletion | MemberModification {
        if (value instanceof Definition) {
            return this.visitDefinition(value);
        } else if (value instanceof Deletion) {
            return this.visitDeletion(value);
        } else {
            return this.visitMemberModification(value);
        }
    }

    visitDefinition(definition: Definition): Definition {
        return this.visit(definition, 'visitDefinition', () => this.visitDefinitionContent(definition));
    }

    visitDefinitionContent(definition: Definition) {
        definition.type = this.visitType(definition.type);
    }

    visitDeletion(deletion: Deletion): Deletion {
        return this.visit(deletion, 'visitDeletion');
    }

    visitMemberModification(memberModification: MemberModification): MemberModification {
        return this.visit(memberModification, 'visitMemberModification', () =>
            this.visitMemberModificationContent(memberModification)
        );
    }

    visitMemberModificationContent(memberModification: MemberModification) {
        memberModification.values = memberModification.values.map((value) =>
            this.dispatchMemberModificationValue(value)
        );
    }

    dispatchMemberModificationValue(value: MemberDeletion | MemberAddition): MemberDeletion | MemberAddition {
        if (value instanceof MemberDeletion) {
            return this.visitMemberDeletion(value);
        } else {
            return this.visitMemberAddition(value);
        }
    }

    visitMemberDeletion(memberDeletion: MemberDeletion): MemberDeletion {
        return this.visit(memberDeletion, 'visitMemberDeletion');
    }

    visitMemberAddition(memberAddition: MemberAddition): MemberAddition {
        return this.visit(memberAddition, 'visitMemberAddition', () => {
            memberAddition.value = this.dispatchMemberAdditionValue(memberAddition.value);
        });
    }

    dispatchMemberAdditionValue(value: Type | ProductMember): Type | ProductMember {
        if (value instanceof ProductMember) {
            return this.visitProductMember(value);
        } else {
            return this.visitType(value);
        }
    }

    visitType(type: Type): Type {
        return this.visit(type, 'visitType', () => {
            if (type instanceof VoidType) {
                return this.visitVoidType(type);
            } else if (typeof type === 'string') {
                return this.visitPrimitiveType(type);
            } else if (type instanceof EnumType) {
                return this.visitEnumType(type);
            } else if (type instanceof NamedTypeReference) {
                return this.visitNamedTypeReference(type);
            } else {
                return this.visitTypeWithStructure(type);
            }
        });
    }

    visitVoidType(voidType: VoidType): VoidType {
        return this.visit(voidType, 'visitVoidType');
    }

    visitPrimitiveType(primitiveType: PrimitiveType): PrimitiveType {
        return this.visit(primitiveType, 'visitPrimitiveType');
    }

    visitEnumType(enumType: EnumType): EnumType {
        return this.visit(enumType, 'visitEnumType');
    }

    visitTypeWithStructure(typeWithStructure: TypeWithStructure): TypeWithStructure {
        return this.visit(typeWithStructure, 'visitTypeWithStructure', () => {
            if (typeWithStructure instanceof SumType) {
                return this.visitSumType(typeWithStructure);
            } else if (typeWithStructure instanceof ProductType) {
                return this.visitProductType(typeWithStructure);
            } else {
                return this.visitGenericType(typeWithStructure);
            }
        });
    }

    visitNamedTypeReference(namedTypeReference: NamedTypeReference): NamedTypeReference {
        return this.visit(namedTypeReference, 'visitNamedTypeReference');
    }

    visitSumType(sumType: SumType): SumType {
        return this.visit(sumType, 'visitSumType', () => this.visitSumTypeContent(sumType));
    }

    visitSumTypeContent(sumType: SumType) {
        sumType.members = sumType.members.map((member) => this.visitType(member));
    }

    visitProductType(productType: ProductType): ProductType {
        return this.visit(productType, 'visitProductType', () => this.visitProductTypeContent(productType));
    }

    visitProductTypeContent(productType: ProductType) {
        productType.members = productType.members.map((member) => this.visitProductMember(member));
    }

    visitProductMember(productMember: ProductMember): ProductMember {
        return this.visit(productMember, 'visitProductMember', () => {
            productMember.type = this.visitType(productMember.type);
        });
    }

    visitGenericType(genericType: GenericType): GenericType {
        return this.visit(genericType, 'visitGenericType', () => {
            if (genericType instanceof TupleType) {
                return this.visitTupleType(genericType);
            } else if (genericType instanceof MapType) {
                return this.visitMapType(genericType);
            } else if (genericType instanceof SetType) {
                return this.visitSetType(genericType);
            } else if (genericType instanceof SequenceType) {
                return this.visitSequenceType(genericType);
            } else {
                return this.visitOptionType(genericType);
            }
        });
    }

    visitTupleType(tupleType: TupleType): TupleType {
        return this.visit(tupleType, 'visitTupleType', () => this.visitTupleTypeContent(tupleType));
    }

    visitTupleTypeContent(tupleType: TupleType) {
        tupleType.members = tupleType.members.map((member) => this.visitType(member));
    }

    visitMapType(mapType: MapType): MapType {
        return this.visit(mapType, 'visitMapType', () => this.visitMapTypeContent(mapType));
    }

    visitMapTypeContent(mapType: MapType) {
        mapType.keyType = this.visitType(mapType.keyType);
        mapType.valueType = this.visitType(mapType.valueType);
    }

    visitSetType(setType: SetType): SetType {
        return this.visit(setType, 'visitSetType', () => this.visitSetTypeContent(setType));
    }

    visitSetTypeContent(setType: SetType) {
        setType.keyType = this.visitType(setType.keyType);
    }

    visitSequenceType(sequenceType: SequenceType): SequenceType {
        return this.visit(sequenceType, 'visitSequenceType', () => this.visitSequenceTypeContent(sequenceType));
    }

    visitSequenceTypeContent(sequenceType: SequenceType) {
        sequenceType.elementType = this.visitType(sequenceType.elementType);
    }

    visitOptionType(optionType: OptionType): OptionType {
        return this.visit(optionType, 'visitOptionType', () => this.visitOptionTypeContent(optionType));
    }

    visitOptionTypeContent(optionType: OptionType) {
        optionType.type = this.visitType(optionType.type);
    }

    visitTrivia(trivia: Trivia): Trivia {
        return this.visit(trivia, 'visitTrivia', () => {
            if (trivia instanceof BlockComment) {
                return this.visitBlockComment(trivia);
            } else if (trivia instanceof LineComment) {
                return this.visitLineComment(trivia);
            } else {
                return this.visitWhitespace(trivia);
            }
        });
    }

    visitBlockComment(blockComment: BlockComment): BlockComment {
        return this.visit(blockComment, 'visitBlockComment');
    }

    visitLineComment(lineComment: LineComment): LineComment {
        return this.visit(lineComment, 'visitLineComment');
    }

    visitWhitespace(whitespace: Whitespace): Whitespace {
        return this.visit(whitespace, 'visitWhitespace');
    }
}
