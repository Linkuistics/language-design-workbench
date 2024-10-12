export enum ModelType {
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
    readonly modelType = ModelType.Definition;

    constructor(
        public name: Id,
        public type: Type
    ) {}
}
export function isDefinition(value: Definition | Deletion | MemberModification): value is Definition {
    return value.modelType === ModelType.Definition;
}

export class Deletion {
    readonly modelType = ModelType.Deletion;

    constructor(public name: Id) {}
}
export function isDeletion(value: Definition | Deletion | MemberModification): value is Deletion {
    return value.modelType === ModelType.Deletion;
}

export class MemberModification {
    readonly modelType = ModelType.MemberModification;

    constructor(
        public name: Id,
        public values: (MemberDeletion | MemberAddition)[]
    ) {}
}
export function isMemberModification(value: Definition | Deletion | MemberModification): value is MemberModification {
    return value.modelType === ModelType.MemberModification;
}

export class MemberDeletion {
    readonly modelType = ModelType.MemberDeletion;

    constructor(public name: Id) {}
}
export function isMemberDeletion(value: MemberDeletion | MemberAddition): value is MemberDeletion {
    return value.modelType === ModelType.MemberDeletion;
}

export class MemberAddition {
    readonly modelType = ModelType.MemberAddition;

    constructor(public value: Type | ProductMember) {}
}
export function isMemberAddition(value: MemberDeletion | MemberAddition): value is MemberAddition {
    return value.modelType === ModelType.MemberAddition;
}

export type Type = VoidType | PrimitiveType | EnumType | TypeWithStructure | NamedTypeReference;
export function isType(
    value: VoidType | EnumType | NamedTypeReference | PrimitiveType | TypeWithStructure
): value is Type {
    switch (value.modelType) {
        case ModelType.VoidType:
        case ModelType.PrimitiveType:
        case ModelType.EnumType:
        case ModelType.NamedTypeReference:
        case ModelType.SumType:
        case ModelType.ProductType:
        case ModelType.TupleType:
        case ModelType.MapType:
        case ModelType.SetType:
        case ModelType.SequenceType:
        case ModelType.OptionType:
            return true;
        default:
            return false;
    }
}

export class VoidType {
    readonly modelType = ModelType.VoidType;
}
export function isVoidType(value: Type): value is VoidType {
    return value.modelType === ModelType.VoidType;
}

export class PrimitiveType {
    readonly modelType = ModelType.PrimitiveType;

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
    return value.modelType === ModelType.PrimitiveType;
}

export class EnumType {
    readonly modelType = ModelType.EnumType;
    constructor(public members: Id[]) {}
}
export function isEnumType(value: Type): value is EnumType {
    return value.modelType === ModelType.EnumType;
}

export type TypeWithStructure = SumType | ProductType | GenericType;
export function isTypeWithStructure(value: Type): value is TypeWithStructure {
    switch (value.modelType) {
        case ModelType.SumType:
        case ModelType.ProductType:
        case ModelType.TupleType:
        case ModelType.MapType:
        case ModelType.SetType:
        case ModelType.SequenceType:
        case ModelType.OptionType:
            return true;
        default:
            return false;
    }
}

export class SumType {
    readonly modelType = ModelType.SumType;

    constructor(public members: Type[]) {}
}
export function isSumType(value: Type): value is SumType {
    return value.modelType === ModelType.SumType;
}

export class ProductType {
    readonly modelType = ModelType.ProductType;

    constructor(public members: ProductMember[]) {}
}
export function isProductType(value: Type): value is ProductType {
    return value.modelType === ModelType.ProductType;
}

export class ProductMember {
    readonly modelType = ModelType.ProductMember;

    constructor(
        public name: Id,
        public type: Type
    ) {}
}
export function isProductMember(value: any): value is ProductMember {
    return value.modelType === ModelType.ProductMember;
}

export type GenericType = TupleType | MapType | SetType | SequenceType | OptionType;
export function isGenericType(value: Type): value is GenericType {
    switch (value.modelType) {
        case ModelType.TupleType:
        case ModelType.MapType:
        case ModelType.SetType:
        case ModelType.SequenceType:
        case ModelType.OptionType:
            return true;
        default:
            return false;
    }
}

export class TupleType {
    readonly modelType = ModelType.TupleType;

    constructor(public members: Type[]) {}
}
export function isTupleType(value: Type): value is TupleType {
    return value.modelType === ModelType.TupleType;
}

export class MapType {
    readonly modelType = ModelType.MapType;

    constructor(
        public keyType: Type,
        public valueType: Type
    ) {}
}
export function isMapType(value: Type): value is MapType {
    return value.modelType === ModelType.MapType;
}

export class SetType {
    readonly modelType = ModelType.SetType;

    constructor(public keyType: Type) {}
}
export function isSetType(value: Type): value is SetType {
    return value.modelType === ModelType.SetType;
}

export class SequenceType {
    readonly modelType = ModelType.SequenceType;

    constructor(public elementType: Type) {}
}
export function isSequenceType(value: Type): value is SequenceType {
    return value.modelType === ModelType.SequenceType;
}

export class OptionType {
    readonly modelType = ModelType.OptionType;

    constructor(public type: Type) {}
}
export function isOptionType(value: Type): value is OptionType {
    return value.modelType === ModelType.OptionType;
}

export class NamedTypeReference {
    readonly modelType = ModelType.NamedTypeReference;

    constructor(public names: Id[]) {}
}
export function isNamedTypeReference(value: Type): value is NamedTypeReference {
    return value.modelType === ModelType.NamedTypeReference;
}

export type Id = string;

export type Trivia = LineComment | BlockComment | Whitespace;

export class BlockComment {
    readonly modelType = ModelType.BlockComment;

    constructor(public value: string) {}
}
export function isBlockComment(value: Trivia): value is BlockComment {
    return value.modelType === ModelType.BlockComment;
}

export class LineComment {
    readonly modelType = ModelType.LineComment;

    constructor(public value: string) {}
}
export function isLineComment(value: Trivia): value is LineComment {
    return value.modelType === ModelType.LineComment;
}

export class Whitespace {
    readonly modelType = ModelType.Whitespace;

    constructor(public value: string) {}
}
export function isWhitespace(value: Trivia): value is Whitespace {
    return value.modelType === ModelType.Whitespace;
}
