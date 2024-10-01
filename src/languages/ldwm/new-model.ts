export class Model {
    constructor(
        public name: Id,
        public parentName: Id | undefined,
        public values: (Definition | Deletion | MemberModification)[]
    ) {}
}

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
    constructor(public value: Type | ProductMember) {}
}

export type Type =
    | VoidType
    | PrimitiveType
    | EnumType
    | TypeWithStructure
    | NamedTypeReference;

export class VoidType {}

export type PrimitiveType =
    | 'boolean'
    | 'char'
    | 'string'
    | 'i8'
    | 'i16'
    | 'i32'
    | 'i64'
    | 'u8'
    | 'u16'
    | 'u32'
    | 'u64'
    | 'f32'
    | 'f64';

export class EnumType {
    constructor(public members: Id[]) {}
}

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

export type GenericType =
    | TupleType
    | MapType
    | SetType
    | SequenceType
    | OptionType
    | ResultType;

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

export class ResultType {
    constructor(
        public okType: Type,
        public errType: Type
    ) {}
}

export class NamedTypeReference {
    constructor(public names: Id[]) {}
}

type Id = string;

export type Trivia = LineComment | BlockComment | Whitespace;

export class BlockComment {
    constructor(public value: string) {}
}

export class LineComment {
    constructor(public value: string) {}
}

export class Whitespace {
    constructor(public value: string) {}
}
