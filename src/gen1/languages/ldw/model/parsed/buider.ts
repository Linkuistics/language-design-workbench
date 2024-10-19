// Generated on 2024-10-19T22:19:40.084Z
import * as Model from './model';

enum Buildable {
    Model,
    Definition,
    Deletion,
    MemberModification,
    MemberDeletion,
    MemberAddition,
    VoidType,
    EnumType,
    SumType,
    ProductType,
    ProductMember,
    TupleType,
    MapType,
    SetType,
    SequenceType,
    OptionType,
    NamedTypeReference,
    Whitespace,
    LineComment,
    BlockComment
}

enum ModelField {
    Name,
    ParentName,
    Value,
    Value
}

enum DefinitionField {
    Name,
    Type
}

enum DeletionField {
    Name
}

enum MemberModificationField {
    Name,
    Value,
    Value
}

enum MemberDeletionField {
    Name
}

enum MemberAdditionField {
    Value
}

enum VoidTypeField {}

enum EnumTypeField {
    Member,
    Member
}

enum SumTypeField {
    Member,
    Member
}

enum ProductTypeField {
    Member,
    Member
}

enum ProductMemberField {
    Name,
    Type
}

enum TupleTypeField {
    Member,
    Member
}

enum MapTypeField {
    KeyType,
    ValueType
}

enum SetTypeField {
    KeyType
}

enum SequenceTypeField {
    ElementType
}

enum OptionTypeField {
    Type
}

enum NamedTypeReferenceField {
    Fqn
}

enum WhitespaceField {
    Value
}

enum LineCommentField {
    Value
}

enum BlockCommentField {
    Value
}

export class Builder {
    mark(): Mark {}
    restore(mark: Mark) {}

    startDDD(): void {}

    finalise(): void {}

    setFFF(): void {}

    setDDDFFF(): void {}

    instructions: Instruction[] = [];
}

interface Mark {
    instructionsLength: number;
    typeStackLength: number;
}

type Instruction = SetInstruction | ExplicitSetInstruction | StartInstruction;
