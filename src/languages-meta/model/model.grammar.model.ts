export class Model {
    constructor(
        public name: Id,
        public parentName: Id | undefined,
        public deletions: Deletion[],
        public memberModifications: MemberModification[],
        public definitions: Definition[]
    ) {}
}

export class Definition {
    constructor(
        public name: Id,
        public type: Type
    ) {}
}

export type Deletion = Id;

export class MemberModification {
    constructor(
        public name: Id,
        public memberDeletion: MemberDeletion,
        public memberAddition: MemberAddition
    ) {}
}

export type MemberDeletion = Id;

export class MemberAddition {
    constructor(
        public productMember: ProductMember,
        public type: Type
    ) {}
}

export type Type = VoidType | PrimitiveType | EnumType | TypeWithStructure | NamedTypeReference;

export class VoidType {}

export enum PrimitiveType {
    Boolean,
    Char,
    String,
    I8,
    I16,
    I32,
    I64,
    U8,
    U16,
    U32,
    U64,
    F32,
    F64
}

export class EnumType {
    constructor(public members: StringElement[]) {}
}

export type StringElement = Id;

export type TypeWithStructure = SumType | ProductType | GenericType;

export class SumType {
    constructor(public members: Type[]) {}
}

export class ProductType {
    constructor(public members: ProductMember[]) {}
}

export class ProductMember {
    constructor(
        public name: Id,
        public type: Type
    ) {}
}

export type GenericType = TupleType | MapType | SetType | SequenceType | OptionType;

export class TupleType {
    constructor(public members: Type[]) {}
}

export class MapType {
    constructor(
        public keyType: Type,
        public valueType: Type
    ) {}
}

export class SetType {
    constructor(public keyType: Type) {}
}

export class SequenceType {
    constructor(public elementType: Type) {}
}

export class OptionType {
    constructor(public type: Type) {}
}

export class NamedTypeReference {
    constructor(public names: Id[]) {}
}

export type Id = Identifier;

export type Identifier = string;

export type InitialIdentifierChar = string;

export type IdentifierChar = string;

export type Trivia = LineComment | BlockComment | Whitespace;

export class Whitespace {
    constructor(public value: string) {}
}

export class LineComment {
    constructor(public value: string) {}
}

export class BlockComment {
    constructor(public value: string) {}
}
