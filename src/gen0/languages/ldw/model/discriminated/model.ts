export enum Discriminator {
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
    BlockComment,
    LineComment,
    Whitespace,
    PrimitiveType
}

export class Model {
    constructor(
        public name: Id[],
        public parent: Model | undefined,
        public definitions: Definition[]
    ) {}
}

export class Definition {
    constructor(
        public name: Id,
        public type: Type,
        public isDiscriminated: boolean
    ) {}
}

export type Type = VoidType | PrimitiveType | EnumType | TypeWithStructure | NamedTypeReference;
export function isType(
    value: VoidType | EnumType | NamedTypeReference | PrimitiveType | TypeWithStructure
): value is Type {
    switch (value.discriminator) {
        case Discriminator.VoidType:
        case Discriminator.PrimitiveType:
        case Discriminator.EnumType:
        case Discriminator.NamedTypeReference:
        case Discriminator.SumType:
        case Discriminator.ProductType:
        case Discriminator.TupleType:
        case Discriminator.MapType:
        case Discriminator.SetType:
        case Discriminator.SequenceType:
        case Discriminator.OptionType:
            return true;
        default:
            return false;
    }
}

export class VoidType {
    readonly discriminator = Discriminator.VoidType;
}
export function isVoidType(value: Type): value is VoidType {
    return value.discriminator === Discriminator.VoidType;
}

export class PrimitiveType {
    readonly discriminator = Discriminator.PrimitiveType;

    static String: PrimitiveType = new PrimitiveType('string');
    static Boolean: PrimitiveType = new PrimitiveType('boolean');
    static Char: PrimitiveType = new PrimitiveType('char');
    static I8: PrimitiveType = new PrimitiveType('i8');
    static I16: PrimitiveType = new PrimitiveType('i16');
    static I32: PrimitiveType = new PrimitiveType('i32');
    static I64: PrimitiveType = new PrimitiveType('i64');
    static U8: PrimitiveType = new PrimitiveType('u8');
    static U16: PrimitiveType = new PrimitiveType('u16');
    static U32: PrimitiveType = new PrimitiveType('u32');
    static U64: PrimitiveType = new PrimitiveType('u64');
    static F32: PrimitiveType = new PrimitiveType('f32');
    static F64: PrimitiveType = new PrimitiveType('f64');

    constructor(
        readonly value:
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
            | 'f64'
    ) {}
}
export function isPrimitiveType(value: Type): value is PrimitiveType {
    return value.discriminator === Discriminator.PrimitiveType;
}

export class EnumType {
    readonly discriminator = Discriminator.EnumType;
    constructor(public members: Id[]) {}
}
export function isEnumType(value: Type): value is EnumType {
    return value.discriminator === Discriminator.EnumType;
}

export type TypeWithStructure = SumType | ProductType | GenericType;
export function isTypeWithStructure(value: Type): value is TypeWithStructure {
    switch (value.discriminator) {
        case Discriminator.SumType:
        case Discriminator.ProductType:
        case Discriminator.TupleType:
        case Discriminator.MapType:
        case Discriminator.SetType:
        case Discriminator.SequenceType:
        case Discriminator.OptionType:
            return true;
        default:
            return false;
    }
}

export class SumType {
    readonly discriminator = Discriminator.SumType;

    constructor(public members: Type[]) {}
}
export function isSumType(value: Type): value is SumType {
    return value.discriminator === Discriminator.SumType;
}

export class ProductType {
    readonly discriminator = Discriminator.ProductType;

    constructor(public members: ProductMember[]) {}
}
export function isProductType(value: Type): value is ProductType {
    return value.discriminator === Discriminator.ProductType;
}

export class ProductMember {
    readonly discriminator = Discriminator.ProductMember;

    constructor(
        public name: Id,
        public type: Type
    ) {}
}
export function isProductMember(value: any): value is ProductMember {
    return value.discriminator === Discriminator.ProductMember;
}

export type GenericType = TupleType | MapType | SetType | SequenceType | OptionType;
export function isGenericType(value: Type): value is GenericType {
    switch (value.discriminator) {
        case Discriminator.TupleType:
        case Discriminator.MapType:
        case Discriminator.SetType:
        case Discriminator.SequenceType:
        case Discriminator.OptionType:
            return true;
        default:
            return false;
    }
}

export class TupleType {
    readonly discriminator = Discriminator.TupleType;

    constructor(public members: Type[]) {}
}
export function isTupleType(value: Type): value is TupleType {
    return value.discriminator === Discriminator.TupleType;
}

export class MapType {
    readonly discriminator = Discriminator.MapType;

    constructor(
        public keyType: Type,
        public valueType: Type
    ) {}
}
export function isMapType(value: Type): value is MapType {
    return value.discriminator === Discriminator.MapType;
}

export class SetType {
    readonly discriminator = Discriminator.SetType;

    constructor(public keyType: Type) {}
}
export function isSetType(value: Type): value is SetType {
    return value.discriminator === Discriminator.SetType;
}

export class SequenceType {
    readonly discriminator = Discriminator.SequenceType;

    constructor(public elementType: Type) {}
}
export function isSequenceType(value: Type): value is SequenceType {
    return value.discriminator === Discriminator.SequenceType;
}

export class OptionType {
    readonly discriminator = Discriminator.OptionType;

    constructor(public type: Type) {}
}
export function isOptionType(value: Type): value is OptionType {
    return value.discriminator === Discriminator.OptionType;
}

export class NamedTypeReference {
    readonly discriminator = Discriminator.NamedTypeReference;

    constructor(public names: Id[]) {}
}
export function isNamedTypeReference(value: Type): value is NamedTypeReference {
    return value.discriminator === Discriminator.NamedTypeReference;
}

export type Id = string;

export type Trivia = LineComment | BlockComment | Whitespace;

export class BlockComment {
    readonly discriminator = Discriminator.BlockComment;

    constructor(public value: string) {}
}
export function isBlockComment(value: Trivia): value is BlockComment {
    return value.discriminator === Discriminator.BlockComment;
}

export class LineComment {
    readonly discriminator = Discriminator.LineComment;

    constructor(public value: string) {}
}
export function isLineComment(value: Trivia): value is LineComment {
    return value.discriminator === Discriminator.LineComment;
}

export class Whitespace {
    readonly discriminator = Discriminator.Whitespace;

    constructor(public value: string) {}
}
export function isWhitespace(value: Trivia): value is Whitespace {
    return value.discriminator === Discriminator.Whitespace;
}
