export class Model {
    constructor(
        name: Id,
        parentName: Id | undefined,
        values: (Definition | Deletion | MemberModification)[]
    ) {}
}

export class Definition {
    constructor(name: Id, type: Type) {}
}

export class Deletion {
    constructor(name: Id) {}
}

export class MemberModification {
    constructor(name: Id, values: (MemberDeletion | MemberAddition)[]) {}
}

export class MemberDeletion {
    constructor(name: Id) {}
}

export class MemberAddition {
    constructor(value: Type | ProductMember) {}
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
    constructor(members: Type[]) {}
}

export class ProductType {
    constructor(members: ProductMember[]) {}
}

export interface ProductMember {
    name: Id;
    type: Type;
}

export type GenericType =
    | TupleType
    | MapType
    | SetType
    | OptionType
    | ResultType;

export class TupleType {
    constructor(members: Type[]) {}
}

export class MapType {
    constructor(keyType: Type, valueType: Type) {}
}

export class SetType {
    constructor(keyType: Type) {}
}

export class OptionType {
    constructor(type: Type) {}
}

export class ResultType {
    constructor(okType: Type, errType: Type) {}
}

export interface NamedTypeReference {
    names: Id[];
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
