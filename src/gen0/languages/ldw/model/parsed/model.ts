export enum ModelTypeId {
    Definition,
    Deletion,
    MemberModification,
    MemberAddition,
    MemberDeletion,
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
        public parentName: Id[] | undefined,
        public values: (Definition | Deletion | MemberModification)[]
    ) {}
}

export class Definition {
    readonly modelType = ModelTypeId.Definition;

    constructor(
        public name: Id,
        public type: Type
    ) {}
}
export function isDefinition(value: Definition | Deletion | MemberModification): value is Definition {
    return value.modelType === ModelTypeId.Definition;
}

export class Deletion {
    readonly modelType = ModelTypeId.Deletion;

    constructor(public name: Id) {}
}
export function isDeletion(value: Definition | Deletion | MemberModification): value is Deletion {
    return value.modelType === ModelTypeId.Deletion;
}

export class MemberModification {
    readonly modelType = ModelTypeId.MemberModification;

    constructor(
        public name: Id,
        public values: (MemberDeletion | MemberAddition)[]
    ) {}
}
export function isMemberModification(value: Definition | Deletion | MemberModification): value is MemberModification {
    return value.modelType === ModelTypeId.MemberModification;
}

export class MemberDeletion {
    readonly modelType = ModelTypeId.MemberDeletion;

    constructor(public name: Id) {}
}
export function isMemberDeletion(value: MemberDeletion | MemberAddition): value is MemberDeletion {
    return value.modelType === ModelTypeId.MemberDeletion;
}

export class MemberAddition {
    readonly modelType = ModelTypeId.MemberAddition;

    constructor(public value: Type | ProductMember) {}
}
export function isMemberAddition(value: MemberDeletion | MemberAddition): value is MemberAddition {
    return value.modelType === ModelTypeId.MemberAddition;
}

export type Type = VoidType | PrimitiveType | EnumType | TypeWithStructure | NamedTypeReference;
export function isType(
    value: VoidType | EnumType | NamedTypeReference | PrimitiveType | TypeWithStructure
): value is Type {
    switch (value.modelType) {
        case ModelTypeId.VoidType:
        case ModelTypeId.PrimitiveType:
        case ModelTypeId.EnumType:
        case ModelTypeId.NamedTypeReference:
        case ModelTypeId.SumType:
        case ModelTypeId.ProductType:
        case ModelTypeId.TupleType:
        case ModelTypeId.MapType:
        case ModelTypeId.SetType:
        case ModelTypeId.SequenceType:
        case ModelTypeId.OptionType:
            return true;
        default:
            return false;
    }
}

export class VoidType {
    readonly modelType = ModelTypeId.VoidType;
}
export function isVoidType(value: Type): value is VoidType {
    return value.modelType === ModelTypeId.VoidType;
}

export class PrimitiveType {
    readonly modelType = ModelTypeId.PrimitiveType;

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
    return value.modelType === ModelTypeId.PrimitiveType;
}

export class EnumType {
    readonly modelType = ModelTypeId.EnumType;
    constructor(public members: Id[]) {}
}
export function isEnumType(value: Type): value is EnumType {
    return value.modelType === ModelTypeId.EnumType;
}

export type TypeWithStructure = SumType | ProductType | GenericType;
export function isTypeWithStructure(value: Type): value is TypeWithStructure {
    switch (value.modelType) {
        case ModelTypeId.SumType:
        case ModelTypeId.ProductType:
        case ModelTypeId.TupleType:
        case ModelTypeId.MapType:
        case ModelTypeId.SetType:
        case ModelTypeId.SequenceType:
        case ModelTypeId.OptionType:
            return true;
        default:
            return false;
    }
}

export class SumType {
    readonly modelType = ModelTypeId.SumType;

    constructor(public members: Type[]) {}
}
export function isSumType(value: Type): value is SumType {
    return value.modelType === ModelTypeId.SumType;
}

export class ProductType {
    readonly modelType = ModelTypeId.ProductType;

    constructor(public members: ProductMember[]) {}
}
export function isProductType(value: Type): value is ProductType {
    return value.modelType === ModelTypeId.ProductType;
}

export class ProductMember {
    readonly modelType = ModelTypeId.ProductMember;

    constructor(
        public name: Id,
        public type: Type
    ) {}
}
export function isProductMember(value: any): value is ProductMember {
    return value.modelType === ModelTypeId.ProductMember;
}

export type GenericType = TupleType | MapType | SetType | SequenceType | OptionType;
export function isGenericType(value: Type): value is GenericType {
    switch (value.modelType) {
        case ModelTypeId.TupleType:
        case ModelTypeId.MapType:
        case ModelTypeId.SetType:
        case ModelTypeId.SequenceType:
        case ModelTypeId.OptionType:
            return true;
        default:
            return false;
    }
}

export class TupleType {
    readonly modelType = ModelTypeId.TupleType;

    constructor(public members: Type[]) {}
}
export function isTupleType(value: Type): value is TupleType {
    return value.modelType === ModelTypeId.TupleType;
}

export class MapType {
    readonly modelType = ModelTypeId.MapType;

    constructor(
        public keyType: Type,
        public valueType: Type
    ) {}
}
export function isMapType(value: Type): value is MapType {
    return value.modelType === ModelTypeId.MapType;
}

export class SetType {
    readonly modelType = ModelTypeId.SetType;

    constructor(public keyType: Type) {}
}
export function isSetType(value: Type): value is SetType {
    return value.modelType === ModelTypeId.SetType;
}

export class SequenceType {
    readonly modelType = ModelTypeId.SequenceType;

    constructor(public elementType: Type) {}
}
export function isSequenceType(value: Type): value is SequenceType {
    return value.modelType === ModelTypeId.SequenceType;
}

export class OptionType {
    readonly modelType = ModelTypeId.OptionType;

    constructor(public type: Type) {}
}
export function isOptionType(value: Type): value is OptionType {
    return value.modelType === ModelTypeId.OptionType;
}

export class NamedTypeReference {
    readonly modelType = ModelTypeId.NamedTypeReference;

    constructor(public names: Id[]) {}
}
export function isNamedTypeReference(value: Type): value is NamedTypeReference {
    return value.modelType === ModelTypeId.NamedTypeReference;
}

export type Id = string;

export type Trivia = LineComment | BlockComment | Whitespace;

export class BlockComment {
    readonly modelType = ModelTypeId.BlockComment;

    constructor(public value: string) {}
}
export function isBlockComment(value: Trivia): value is BlockComment {
    return value.modelType === ModelTypeId.BlockComment;
}

export class LineComment {
    readonly modelType = ModelTypeId.LineComment;

    constructor(public value: string) {}
}
export function isLineComment(value: Trivia): value is LineComment {
    return value.modelType === ModelTypeId.LineComment;
}

export class Whitespace {
    readonly modelType = ModelTypeId.Whitespace;

    constructor(public value: string) {}
}
export function isWhitespace(value: Trivia): value is Whitespace {
    return value.modelType === ModelTypeId.Whitespace;
}
