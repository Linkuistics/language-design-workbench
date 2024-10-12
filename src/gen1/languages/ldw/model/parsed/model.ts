export class Model {
    constructor(
        public name: Fqn,
        public parentName: Fqn | undefined,
        public values: (Deletion | MemberModification | Definition)[]
    ) {}
}

export type Fqn = Id[];

export class Definition {
    constructor(
        public name: Id,
        public type: Type
    ) {}
}

export class Deletion {
    constructor(public name: Id) {}
}

export class MemberModification {
    constructor(
        public name: Id,
        public values: (MemberDeletion | MemberAddition)[]
    ) {}
}

export class MemberDeletion {
    constructor(public name: Id) {}
}

export class MemberAddition {
    constructor(public value: ProductMember | Type) {}
}

export type Type = VoidType | PrimitiveType | EnumType | TypeWithStructure | NamedTypeReference;

export class VoidType {}

export enum PrimitiveType {
    Boolean = 1,
    Char = 2,
    String = 3,
    I8 = 4,
    I16 = 5,
    I32 = 6,
    I64 = 7,
    U8 = 8,
    U16 = 9,
    U32 = 10,
    U64 = 11,
    F32 = 12,
    F64 = 13
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
    constructor(public fqn: Fqn) {}
}

export type Id = Identifier;

export type Identifier = number;

export type InitialIdentifierChar = number;

export type IdentifierChar = number;

export type Trivia = LineComment | BlockComment | Whitespace;

export class Whitespace {
    constructor(public value: number) {}
}

export class LineComment {
    constructor(public value: number) {}
}

export class BlockComment {
    constructor(public value: number) {}
}
