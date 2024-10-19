// Generated on 2024-10-19T22:19:44.565Z
import * as Model from './model';

enum Buildable {
    Model,
    Definition,
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
    Parent,
    Definition
}

enum DefinitionField {
    Name,
    Type,
    DiscriminationPeer,
    DiscriminationMember
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
