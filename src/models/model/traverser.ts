import {
    Model,
    Definition,
    Deletion,
    MemberModification,
    MemberDeletion,
    MemberAddition,
    Type,
    VoidType,
    PrimitiveType,
    EnumType,
    TypeWithStructure,
    NamedTypeReference,
    SumType,
    ProductType,
    ProductMember,
    GenericType,
    TupleType,
    MapType,
    SetType,
    SequenceType,
    OptionType,
    ResultType,
    Trivia,
    BlockComment,
    LineComment,
    Whitespace
} from './model';

export interface TraverseDelegate {
    visitModel?(model: Model, traverser: Traverser): Model;

    visitDefinition?(definition: Definition, traverser: Traverser): Definition;

    visitDeletion?(deletion: Deletion, traverser: Traverser): Deletion;

    visitMemberModification?(
        memberModification: MemberModification,
        traverser: Traverser
    ): MemberModification;

    visitMemberDeletion?(
        memberDeletion: MemberDeletion,
        traverser: Traverser
    ): MemberDeletion;

    visitMemberAddition?(
        memberAddition: MemberAddition,
        traverser: Traverser
    ): MemberAddition;

    visitType?(type: Type, traverser: Traverser): Type;

    visitVoidType?(voidType: VoidType, traverser: Traverser): VoidType;

    visitPrimitiveType?(
        primitiveType: PrimitiveType,
        traverser: Traverser
    ): PrimitiveType;

    visitEnumType?(enumType: EnumType, traverser: Traverser): EnumType;

    visitTypeWithStructure?(
        typeWithStructure: TypeWithStructure,
        traverser: Traverser
    ): TypeWithStructure;

    visitNamedTypeReference?(
        namedTypeReference: NamedTypeReference,
        traverser: Traverser
    ): NamedTypeReference;

    visitSumType?(sumType: SumType, traverser: Traverser): SumType;

    visitProductType?(
        productType: ProductType,
        traverser: Traverser
    ): ProductType;

    visitProductMember?(
        productMember: ProductMember,
        traverser: Traverser
    ): ProductMember;

    visitGenericType?(
        genericType: GenericType,
        traverser: Traverser
    ): GenericType;

    visitTupleType?(tupleType: TupleType, traverser: Traverser): TupleType;

    visitMapType?(mapType: MapType, traverser: Traverser): MapType;

    visitSetType?(setType: SetType, traverser: Traverser): SetType;

    visitSequenceType?(
        sequenceType: SequenceType,
        traverser: Traverser
    ): SequenceType;

    visitOptionType?(optionType: OptionType, traverser: Traverser): OptionType;

    visitResultType?(resultType: ResultType, traverser: Traverser): ResultType;

    visitTrivia?(trivia: Trivia, traverser: Traverser): Trivia;

    visitBlockComment?(
        blockComment: BlockComment,
        traverser: Traverser
    ): BlockComment;

    visitLineComment?(
        lineComment: LineComment,
        traverser: Traverser
    ): LineComment;

    visitWhitespace?(whitespace: Whitespace, traverser: Traverser): Whitespace;
}

export class Traverser {
    constructor(public delegate: TraverseDelegate) {}

    visitModel(model: Model): Model {
        if (this.delegate.visitModel)
            return this.delegate.visitModel(model, this);
        this.visitModelChildren(model);
        return model;
    }

    visitModelChildren(model: Model) {
        for (let i = 0; i < model.values.length; i++) {
            model.values[i] = this.dispatchModelValue(model.values[i]);
        }
    }

    dispatchModelValue(value: Definition | Deletion | MemberModification) {
        if (value instanceof Definition) {
            return this.visitDefinition(value);
        } else if (value instanceof Deletion) {
            return this.visitDeletion(value);
        } else {
            return this.visitMemberModification(value);
        }
    }

    visitDefinition(definition: Definition): Definition {
        if (this.delegate.visitDefinition)
            return this.delegate.visitDefinition(definition, this);
        this.visitDefinitionChildren(definition);
        return definition;
    }

    visitDefinitionChildren(definition: Definition) {
        definition.type = this.visitType(definition.type);
    }

    visitDeletion(deletion: Deletion): Deletion {
        if (this.delegate.visitDeletion)
            return this.delegate.visitDeletion(deletion, this);
        return deletion;
    }

    visitMemberModification(
        memberModification: MemberModification
    ): MemberModification {
        if (this.delegate.visitMemberModification)
            return this.delegate.visitMemberModification(
                memberModification,
                this
            );
        this.visitMemberModificationChildren(memberModification);
        return memberModification;
    }

    visitMemberModificationChildren(memberModification: MemberModification) {
        for (let i = 0; i < memberModification.values.length; i++) {
            memberModification.values[i] = this.dispatchMemberModificationValue(
                memberModification.values[i]
            );
        }
    }

    dispatchMemberModificationValue(value: MemberDeletion | MemberAddition) {
        if (value instanceof MemberDeletion) {
            return this.visitMemberDeletion(value);
        } else {
            return this.visitMemberAddition(value);
        }
    }

    visitMemberDeletion(memberDeletion: MemberDeletion): MemberDeletion {
        if (this.delegate.visitMemberDeletion)
            return this.delegate.visitMemberDeletion(memberDeletion, this);
        return memberDeletion;
    }

    visitMemberAddition(memberAddition: MemberAddition): MemberAddition {
        if (this.delegate.visitMemberAddition)
            return this.delegate.visitMemberAddition(memberAddition, this);
        memberAddition.value = this.dispatchMemberAdditionValue(
            memberAddition.value
        );
        return memberAddition;
    }

    dispatchMemberAdditionValue(
        value: Type | ProductMember
    ): Type | ProductMember {
        if (this.isType(value)) {
            return this.visitType(value);
        } else {
            return this.visitProductMember(value);
        }
    }

    visitType(type: Type): Type {
        if (this.delegate.visitType) return this.delegate.visitType(type, this);
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
        if (this.delegate.visitVoidType)
            return this.delegate.visitVoidType(voidType, this);
        return voidType;
    }

    visitPrimitiveType(primitiveType: PrimitiveType): PrimitiveType {
        if (this.delegate.visitPrimitiveType)
            return this.delegate.visitPrimitiveType(primitiveType, this);
        return primitiveType;
    }

    visitEnumType(enumType: EnumType): EnumType {
        if (this.delegate.visitEnumType)
            return this.delegate.visitEnumType(enumType, this);
        return enumType;
    }

    visitTypeWithStructure(
        typeWithStructure: TypeWithStructure
    ): TypeWithStructure {
        if (this.delegate.visitTypeWithStructure)
            return this.delegate.visitTypeWithStructure(
                typeWithStructure,
                this
            );
        return this.dispatchTypeWithStructure(typeWithStructure);
    }

    dispatchTypeWithStructure(
        typeWithStructure: TypeWithStructure
    ): TypeWithStructure {
        if (typeWithStructure instanceof SumType) {
            return this.visitSumType(typeWithStructure);
        } else if (typeWithStructure instanceof ProductType) {
            return this.visitProductType(typeWithStructure);
        } else {
            return this.visitGenericType(typeWithStructure);
        }
    }

    visitNamedTypeReference(
        namedTypeReference: NamedTypeReference
    ): NamedTypeReference {
        if (this.delegate.visitNamedTypeReference)
            return this.delegate.visitNamedTypeReference(
                namedTypeReference,
                this
            );
        return namedTypeReference;
    }

    visitSumType(sumType: SumType): SumType {
        if (this.delegate.visitSumType)
            return this.delegate.visitSumType(sumType, this);
        this.visitSumTypeChildren(sumType);
        return sumType;
    }

    visitSumTypeChildren(sumType: SumType) {
        for (let i = 0; i < sumType.members.length; i++) {
            sumType.members[i] = this.visitType(sumType.members[i]);
        }
    }

    visitProductType(productType: ProductType): ProductType {
        if (this.delegate.visitProductType)
            return this.delegate.visitProductType(productType, this);
        this.visitProductTypeChildren(productType);
        return productType;
    }

    visitProductTypeChildren(productType: ProductType) {
        for (let i = 0; i < productType.members.length; i++) {
            productType.members[i] = this.visitProductMember(
                productType.members[i]
            );
        }
    }

    visitProductMember(productMember: ProductMember): ProductMember {
        if (this.delegate.visitProductMember)
            return this.delegate.visitProductMember(productMember, this);
        productMember.type = this.visitType(productMember.type);
        return productMember;
    }

    visitGenericType(genericType: GenericType): GenericType {
        if (this.delegate.visitGenericType)
            return this.delegate.visitGenericType(genericType, this);
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
        } else if (genericType instanceof OptionType) {
            return this.visitOptionType(genericType);
        } else {
            return this.visitResultType(genericType);
        }
    }

    visitTupleType(tupleType: TupleType): TupleType {
        if (this.delegate.visitTupleType)
            return this.delegate.visitTupleType(tupleType, this);
        this.visitTupleTypeChildren(tupleType);
        return tupleType;
    }

    visitTupleTypeChildren(tupleType: TupleType) {
        for (let i = 0; i < tupleType.members.length; i++) {
            tupleType.members[i] = this.visitType(tupleType.members[i]);
        }
    }

    visitMapType(mapType: MapType): MapType {
        if (this.delegate.visitMapType)
            return this.delegate.visitMapType(mapType, this);
        this.visitMapTypeChildren(mapType);
        return mapType;
    }

    visitMapTypeChildren(mapType: MapType) {
        mapType.keyType = this.visitType(mapType.keyType);
        mapType.valueType = this.visitType(mapType.valueType);
    }

    visitSetType(setType: SetType): SetType {
        if (this.delegate.visitSetType)
            return this.delegate.visitSetType(setType, this);
        this.visitSetTypeChildren(setType);
        return setType;
    }

    visitSetTypeChildren(setType: SetType) {
        setType.keyType = this.visitType(setType.keyType);
    }

    visitSequenceType(sequenceType: SequenceType): SequenceType {
        if (this.delegate.visitSequenceType)
            return this.delegate.visitSequenceType(sequenceType, this);
        this.visitSequenceTypeChildren(sequenceType);
        return sequenceType;
    }

    visitSequenceTypeChildren(sequenceType: SequenceType) {
        sequenceType.elementType = this.visitType(sequenceType.elementType);
    }

    visitOptionType(optionType: OptionType): OptionType {
        if (this.delegate.visitOptionType)
            return this.delegate.visitOptionType(optionType, this);
        this.visitOptionTypeChildren(optionType);
        return optionType;
    }

    visitOptionTypeChildren(optionType: OptionType) {
        optionType.type = this.visitType(optionType.type);
    }

    visitResultType(resultType: ResultType): ResultType {
        if (this.delegate.visitResultType)
            return this.delegate.visitResultType(resultType, this);
        this.visitResultTypeChildren(resultType);
        return resultType;
    }

    visitResultTypeChildren(resultType: ResultType) {
        resultType.okType = this.visitType(resultType.okType);
        resultType.errType = this.visitType(resultType.errType);
    }

    visitTrivia(trivia: Trivia): Trivia {
        if (this.delegate.visitTrivia)
            return this.delegate.visitTrivia(trivia, this);
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
        if (this.delegate.visitBlockComment)
            return this.delegate.visitBlockComment(blockComment, this);
        return blockComment;
    }

    visitLineComment(lineComment: LineComment): LineComment {
        if (this.delegate.visitLineComment)
            return this.delegate.visitLineComment(lineComment, this);
        return lineComment;
    }

    visitWhitespace(whitespace: Whitespace): Whitespace {
        if (this.delegate.visitWhitespace)
            return this.delegate.visitWhitespace(whitespace, this);
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
        return (
            value instanceof SumType ||
            value instanceof ProductType ||
            this.isGenericType(value)
        );
    }

    private isGenericType(value: any): value is GenericType {
        return (
            value instanceof TupleType ||
            value instanceof MapType ||
            value instanceof SetType ||
            value instanceof SequenceType ||
            value instanceof OptionType ||
            value instanceof ResultType
        );
    }
}
