export class BlockComment {
    constructor(public value: string) {}
}

export class Definition {
    constructor(
        public name: Id,
        public type: Type
    ) {}
}

export class EnumType {
    constructor(public members: StringElement[]) {}
}

export type Fqn = Id[];

export type GenericType = TupleType | MapType | SetType | SequenceType | OptionType;

export type Id = Identifier;

export type Identifier = string;

export type IdentifierChar = string;

export type InitialIdentifierChar = string;

export class LineComment {
    constructor(public value: string) {}
}

export class MapType {
    constructor(
        public keyType: Type,
        public valueType: Type
    ) {}
}

export class Model {
    constructor(
        public name: Fqn,
        public parentName: Fqn | undefined,
        public definitions: Definition[]
    ) {}
}

export class NamedTypeReference {
    constructor(public fqn: Fqn) {}
}

export class OptionType {
    constructor(public type: Type) {}
}

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

export class ProductMember {
    constructor(
        public name: Id,
        public type: Type
    ) {}
}

export class ProductType {
    constructor(public members: ProductMember[]) {}
}

export class SequenceType {
    constructor(public elementType: Type) {}
}

export class SetType {
    constructor(public keyType: Type) {}
}

export type StringElement = Id;

export class SumType {
    constructor(public members: Type[]) {}
}

export type Trivia = LineComment | BlockComment | Whitespace;

export class TupleType {
    constructor(public members: Type[]) {}
}

export type Type = VoidType | PrimitiveType | EnumType | TypeWithStructure | NamedTypeReference;

export type TypeWithStructure = SumType | ProductType | GenericType;

export class VoidType {}

export class Whitespace {
    constructor(public value: string) {}
}
