export type GenericType =
    | TupleType
    | MapType
    | SetType
    | OptionType
    | ResultType;
export type Id = string;
export type Type =
    | VoidType
    | { primitiveType: PrimitiveType }
    | EnumType
    | TypeWithStructure
    | NamedTypeReference;
export type TypeWithStructure = SumType | ProductType | GenericType;
export type Trivia = LineComment | BlockComment | Whitespace;

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

export class Definition {
    constructor(
        public name: Id,
        public type: Type
    ) {}
}

export class Deletion {
    constructor(public value: string) {}
}

export class EnumType {
    constructor(public members: Id[]) {}
}

export class MapType {
    constructor(
        public keyType: Type,
        public valueType: Type
    ) {}
}

export class MemberAddition {
    constructor(public value: Type | ProductMember) {}
}

export class MemberDeletion {
    constructor(public value: { name: Id } | NamedTypeReference) {}
}

export class MemberModification {
    constructor(
        public name: Id,
        public values: (MemberDeletion | MemberAddition)[]
    ) {}
}

export class Model {
    constructor(
        public name: Id,
        public rootName: Id,
        public parentName: Id | undefined,
        public values: (Definition | Deletion | MemberModification)[]
    ) {}
}

export class NamedTypeReference {
    constructor(public names: Id[]) {}
}

export class ProductMember {
    constructor(
        public name: Id,
        public type: Type
    ) {}
}

export class OptionType {
    constructor(public members: Type[]) {}
}

export class ProductType {
    constructor(public members: ProductMember[]) {}
}

export class ResultType {
    constructor(
        public okType: Type,
        public errType: Type
    ) {}
}

export class SetType {
    constructor(public keyType: Type) {}
}

export class SumType {
    constructor(public members: Type[]) {}
}

export class TupleType {
    constructor(public members: Type[]) {}
}

export class VoidType {}

export class BlockComment {
    constructor(public value: string) {}
}

export class LineComment {
    constructor(public value: string) {}
}

export class Whitespace {
    constructor(public value: string) {}
}
