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

export interface TraverseDelegate {
    visitModel?(model: Model, traverser: Traverser): Model | void;

    visitDefinition?(definition: Definition, traverser: Traverser): Definition | void;

    visitDeletion?(deletion: Deletion, traverser: Traverser): Deletion | void;

    visitMemberModification?(memberModification: MemberModification, traverser: Traverser): MemberModification | void;

    visitMemberDeletion?(memberDeletion: MemberDeletion, traverser: Traverser): MemberDeletion | void;

    visitMemberAddition?(memberAddition: MemberAddition, traverser: Traverser): MemberAddition | void;

    visitType?(type: Type, traverser: Traverser): Type | void;

    visitVoidType?(voidType: VoidType, traverser: Traverser): VoidType | void;

    visitPrimitiveType?(primitiveType: PrimitiveType, traverser: Traverser): PrimitiveType | void;

    visitEnumType?(enumType: EnumType, traverser: Traverser): EnumType | void;

    visitTypeWithStructure?(typeWithStructure: TypeWithStructure, traverser: Traverser): TypeWithStructure | void;

    visitNamedTypeReference?(namedTypeReference: NamedTypeReference, traverser: Traverser): NamedTypeReference | void;

    visitSumType?(sumType: SumType, traverser: Traverser): SumType | void;

    visitProductType?(productType: ProductType, traverser: Traverser): ProductType | void;

    visitProductMember?(productMember: ProductMember, traverser: Traverser): ProductMember | void;

    visitGenericType?(genericType: GenericType, traverser: Traverser): GenericType | void;

    visitTupleType?(tupleType: TupleType, traverser: Traverser): TupleType | void;

    visitMapType?(mapType: MapType, traverser: Traverser): MapType | void;

    visitSetType?(setType: SetType, traverser: Traverser): SetType | void;

    visitSequenceType?(sequenceType: SequenceType, traverser: Traverser): SequenceType | void;

    visitOptionType?(optionType: OptionType, traverser: Traverser): OptionType | void;

    visitTrivia?(trivia: Trivia, traverser: Traverser): Trivia | void;

    visitBlockComment?(blockComment: BlockComment, traverser: Traverser): BlockComment | void;

    visitLineComment?(lineComment: LineComment, traverser: Traverser): LineComment | void;

    visitWhitespace?(whitespace: Whitespace, traverser: Traverser): Whitespace | void;
}

export class Traverser {
    constructor(public delegate: TraverseDelegate) {}

    visitModel(model: Model): Model {
        if (this.delegate.visitModel) {
            const result = this.delegate.visitModel(model, this);
            return result ?? model;
        }
        this.visitModelChildren(model);
        return model;
    }

    visitModelChildren(model: Model) {
        for (let i = 0; i < model.values.length; i++) {
            model.values[i] = this.dispatchModelValue(model.values[i]);
        }
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
        if (this.delegate.visitDefinition) {
            const result = this.delegate.visitDefinition(definition, this);
            return result ?? definition;
        }
        this.visitDefinitionChildren(definition);
        return definition;
    }

    visitDefinitionChildren(definition: Definition) {
        definition.type = this.visitType(definition.type);
    }

    visitDeletion(deletion: Deletion): Deletion {
        if (this.delegate.visitDeletion) {
            const result = this.delegate.visitDeletion(deletion, this);
            return result ?? deletion;
        }
        return deletion;
    }

    visitMemberModification(memberModification: MemberModification): MemberModification {
        if (this.delegate.visitMemberModification) {
            const result = this.delegate.visitMemberModification(memberModification, this);
            return result ?? memberModification;
        }
        this.visitMemberModificationChildren(memberModification);
        return memberModification;
    }

    visitMemberModificationChildren(memberModification: MemberModification) {
        for (let i = 0; i < memberModification.values.length; i++) {
            memberModification.values[i] = this.dispatchMemberModificationValue(memberModification.values[i]);
        }
    }

    dispatchMemberModificationValue(value: MemberDeletion | MemberAddition): MemberDeletion | MemberAddition {
        if (value instanceof MemberDeletion) {
            return this.visitMemberDeletion(value);
        } else {
            return this.visitMemberAddition(value);
        }
    }

    visitMemberDeletion(memberDeletion: MemberDeletion): MemberDeletion {
        if (this.delegate.visitMemberDeletion) {
            const result = this.delegate.visitMemberDeletion(memberDeletion, this);
            return result ?? memberDeletion;
        }
        return memberDeletion;
    }

    visitMemberAddition(memberAddition: MemberAddition): MemberAddition {
        if (this.delegate.visitMemberAddition) {
            const result = this.delegate.visitMemberAddition(memberAddition, this);
            return result ?? memberAddition;
        }
        memberAddition.value = this.dispatchMemberAdditionValue(memberAddition.value);
        return memberAddition;
    }

    dispatchMemberAdditionValue(value: Type | ProductMember): Type | ProductMember {
        if (this.isType(value)) {
            return this.visitType(value);
        } else {
            return this.visitProductMember(value);
        }
    }

    visitType(type: Type): Type {
        if (this.delegate.visitType) {
            const result = this.delegate.visitType(type, this);
            return result ?? type;
        }
        return this.dispatchType(type);
    }

    dispatchType(type: Type): Type {
        if (type instanceof VoidType) {
            return this.visitVoidType(type);
        } else if (typeof type === 'string') {
            return this.visitPrimitiveType(type);
        } else if (type instanceof EnumType) {
            return this.visitEnumType(type);
        } else if (this.isTypeWithStructure(type)) {
            return this.visitTypeWithStructure(type);
        } else {
            return this.visitNamedTypeReference(type);
        }
    }

    visitVoidType(voidType: VoidType): VoidType {
        if (this.delegate.visitVoidType) {
            const result = this.delegate.visitVoidType(voidType, this);
            return result ?? voidType;
        }
        return voidType;
    }

    visitPrimitiveType(primitiveType: PrimitiveType): PrimitiveType {
        if (this.delegate.visitPrimitiveType) {
            const result = this.delegate.visitPrimitiveType(primitiveType, this);
            return result ?? primitiveType;
        }
        return primitiveType;
    }

    visitEnumType(enumType: EnumType): EnumType {
        if (this.delegate.visitEnumType) {
            const result = this.delegate.visitEnumType(enumType, this);
            return result ?? enumType;
        }
        return enumType;
    }

    visitTypeWithStructure(typeWithStructure: TypeWithStructure): TypeWithStructure {
        if (this.delegate.visitTypeWithStructure) {
            const result = this.delegate.visitTypeWithStructure(typeWithStructure, this);
            return result ?? typeWithStructure;
        }
        return this.dispatchTypeWithStructure(typeWithStructure);
    }

    dispatchTypeWithStructure(typeWithStructure: TypeWithStructure): TypeWithStructure {
        if (typeWithStructure instanceof SumType) {
            return this.visitSumType(typeWithStructure);
        } else if (typeWithStructure instanceof ProductType) {
            return this.visitProductType(typeWithStructure);
        } else {
            return this.visitGenericType(typeWithStructure);
        }
    }

    visitNamedTypeReference(namedTypeReference: NamedTypeReference): NamedTypeReference {
        if (this.delegate.visitNamedTypeReference) {
            const result = this.delegate.visitNamedTypeReference(namedTypeReference, this);
            return result ?? namedTypeReference;
        }
        return namedTypeReference;
    }

    visitSumType(sumType: SumType): SumType {
        if (this.delegate.visitSumType) {
            const result = this.delegate.visitSumType(sumType, this);
            return result ?? sumType;
        }
        this.visitSumTypeChildren(sumType);
        return sumType;
    }

    visitSumTypeChildren(sumType: SumType) {
        for (let i = 0; i < sumType.members.length; i++) {
            sumType.members[i] = this.visitType(sumType.members[i]);
        }
    }

    visitProductType(productType: ProductType): ProductType {
        if (this.delegate.visitProductType) {
            const result = this.delegate.visitProductType(productType, this);
            return result ?? productType;
        }
        this.visitProductTypeChildren(productType);
        return productType;
    }

    visitProductTypeChildren(productType: ProductType) {
        for (let i = 0; i < productType.members.length; i++) {
            productType.members[i] = this.visitProductMember(productType.members[i]);
        }
    }

    visitProductMember(productMember: ProductMember): ProductMember {
        if (this.delegate.visitProductMember) {
            const result = this.delegate.visitProductMember(productMember, this);
            return result ?? productMember;
        }
        productMember.type = this.visitType(productMember.type);
        return productMember;
    }

    visitGenericType(genericType: GenericType): GenericType {
        if (this.delegate.visitGenericType) {
            const result = this.delegate.visitGenericType(genericType, this);
            return result ?? genericType;
        }
        return this.dispatchGenericType(genericType);
    }

    dispatchGenericType(genericType: GenericType): GenericType {
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
    }

    visitTupleType(tupleType: TupleType): TupleType {
        if (this.delegate.visitTupleType) {
            const result = this.delegate.visitTupleType(tupleType, this);
            return result ?? tupleType;
        }
        this.visitTupleTypeChildren(tupleType);
        return tupleType;
    }

    visitTupleTypeChildren(tupleType: TupleType) {
        for (let i = 0; i < tupleType.members.length; i++) {
            tupleType.members[i] = this.visitType(tupleType.members[i]);
        }
    }

    visitMapType(mapType: MapType): MapType {
        if (this.delegate.visitMapType) {
            const result = this.delegate.visitMapType(mapType, this);
            return result ?? mapType;
        }
        this.visitMapTypeChildren(mapType);
        return mapType;
    }

    visitMapTypeChildren(mapType: MapType) {
        mapType.keyType = this.visitType(mapType.keyType);
        mapType.valueType = this.visitType(mapType.valueType);
    }

    visitSetType(setType: SetType): SetType {
        if (this.delegate.visitSetType) {
            const result = this.delegate.visitSetType(setType, this);
            return result ?? setType;
        }
        this.visitSetTypeChildren(setType);
        return setType;
    }

    visitSetTypeChildren(setType: SetType) {
        setType.keyType = this.visitType(setType.keyType);
    }

    visitSequenceType(sequenceType: SequenceType): SequenceType {
        if (this.delegate.visitSequenceType) {
            const result = this.delegate.visitSequenceType(sequenceType, this);
            return result ?? sequenceType;
        }
        this.visitSequenceTypeChildren(sequenceType);
        return sequenceType;
    }

    visitSequenceTypeChildren(sequenceType: SequenceType) {
        sequenceType.elementType = this.visitType(sequenceType.elementType);
    }

    visitOptionType(optionType: OptionType): OptionType {
        if (this.delegate.visitOptionType) {
            const result = this.delegate.visitOptionType(optionType, this);
            return result ?? optionType;
        }
        this.visitOptionTypeChildren(optionType);
        return optionType;
    }

    visitOptionTypeChildren(optionType: OptionType) {
        optionType.type = this.visitType(optionType.type);
    }

    visitTrivia(trivia: Trivia): Trivia {
        if (this.delegate.visitTrivia) {
            const result = this.delegate.visitTrivia(trivia, this);
            return result ?? trivia;
        }
        return this.dispatchTrivia(trivia);
    }

    dispatchTrivia(trivia: Trivia): Trivia {
        if (trivia instanceof BlockComment) {
            return this.visitBlockComment(trivia);
        } else if (trivia instanceof LineComment) {
            return this.visitLineComment(trivia);
        } else {
            return this.visitWhitespace(trivia);
        }
    }

    visitBlockComment(blockComment: BlockComment): BlockComment {
        if (this.delegate.visitBlockComment) {
            const result = this.delegate.visitBlockComment(blockComment, this);
            return result ?? blockComment;
        }
        return blockComment;
    }

    visitLineComment(lineComment: LineComment): LineComment {
        if (this.delegate.visitLineComment) {
            const result = this.delegate.visitLineComment(lineComment, this);
            return result ?? lineComment;
        }
        return lineComment;
    }

    visitWhitespace(whitespace: Whitespace): Whitespace {
        if (this.delegate.visitWhitespace) {
            const result = this.delegate.visitWhitespace(whitespace, this);
            return result ?? whitespace;
        }
        return whitespace;
    }

    private isType(value: any): value is Type {
        return (
            value instanceof VoidType ||
            value instanceof EnumType ||
            value instanceof NamedTypeReference ||
            typeof value === 'string' ||
            this.isTypeWithStructure(value)
        );
    }

    private isTypeWithStructure(value: any): value is TypeWithStructure {
        return value instanceof SumType || value instanceof ProductType || this.isGenericType(value);
    }

    private isGenericType(value: any): value is GenericType {
        return (
            value instanceof TupleType ||
            value instanceof MapType ||
            value instanceof SetType ||
            value instanceof SequenceType ||
            value instanceof OptionType
        );
    }
}
