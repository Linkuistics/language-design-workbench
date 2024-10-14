export enum Discriminator {
    Definition,
    Deletion,
    MemberModification,
    MemberDeletion,
    MemberAddition,
    VoidType,
    PrimitiveType,
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

export class Model {
    public name: Fqn;
    public parentName: Fqn | undefined;
    public values: (Deletion | MemberModification | Definition)[];

    constructor(init: {
        name: Fqn;
        parentName?: Fqn | undefined;
        values: (Deletion | MemberModification | Definition)[];
    }) {
        this.name = init.name;
        this.parentName = init.parentName;
        this.values = init.values;
    }
}

export type Fqn = Id[];

export class Definition {
    readonly discriminator = Discriminator.Definition;

    public name: Id;
    public type: Type;

    constructor(init: { name: Id; type: Type }) {
        this.name = init.name;
        this.type = init.type;
    }
}
export function isDefinition(value: Deletion | MemberModification | Definition): value is Definition {
    return value.discriminator === Discriminator.Definition;
}

export class Deletion {
    readonly discriminator = Discriminator.Deletion;

    public name: Id;

    constructor(init: { name: Id }) {
        this.name = init.name;
    }
}
export function isDeletion(value: Deletion | MemberModification | Definition): value is Deletion {
    return value.discriminator === Discriminator.Deletion;
}

export class MemberModification {
    readonly discriminator = Discriminator.MemberModification;

    public name: Id;
    public values: (MemberDeletion | MemberAddition)[];

    constructor(init: { name: Id; values: (MemberDeletion | MemberAddition)[] }) {
        this.name = init.name;
        this.values = init.values;
    }
}
export function isMemberModification(value: Deletion | MemberModification | Definition): value is MemberModification {
    return value.discriminator === Discriminator.MemberModification;
}

export class MemberDeletion {
    readonly discriminator = Discriminator.MemberDeletion;

    public name: Id;

    constructor(init: { name: Id }) {
        this.name = init.name;
    }
}
export function isMemberDeletion(value: MemberDeletion | MemberAddition): value is MemberDeletion {
    return value.discriminator === Discriminator.MemberDeletion;
}

export class MemberAddition {
    readonly discriminator = Discriminator.MemberAddition;

    public value: ProductMember | Type;

    constructor(init: { value: ProductMember | Type }) {
        this.value = init.value;
    }
}
export function isMemberAddition(value: MemberDeletion | MemberAddition): value is MemberAddition {
    return value.discriminator === Discriminator.MemberAddition;
}

export type Type = VoidType | PrimitiveType | EnumType | TypeWithStructure | NamedTypeReference;
export function isType(
    value:
        | ProductMember
        | VoidType
        | PrimitiveType
        | EnumType
        | SumType
        | ProductType
        | TupleType
        | MapType
        | SetType
        | SequenceType
        | OptionType
        | NamedTypeReference
): value is Type {
    switch (value.discriminator) {
        case Discriminator.VoidType:
        case Discriminator.PrimitiveType:
        case Discriminator.EnumType:
        case Discriminator.SumType:
        case Discriminator.ProductType:
        case Discriminator.TupleType:
        case Discriminator.MapType:
        case Discriminator.SetType:
        case Discriminator.SequenceType:
        case Discriminator.OptionType:
        case Discriminator.NamedTypeReference:
            return true;
        default:
            return false;
    }
}

export class VoidType {
    readonly discriminator = Discriminator.VoidType;
}
export function isVoidType(
    value:
        | ProductMember
        | VoidType
        | PrimitiveType
        | EnumType
        | SumType
        | ProductType
        | TupleType
        | MapType
        | SetType
        | SequenceType
        | OptionType
        | NamedTypeReference
): value is VoidType {
    return value.discriminator === Discriminator.VoidType;
}

export enum PrimitiveTypeEnum {
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
export class PrimitiveType {
    readonly discriminator = Discriminator.PrimitiveType;

    static Boolean: PrimitiveType = new PrimitiveType(PrimitiveTypeEnum.Boolean);
    static Char: PrimitiveType = new PrimitiveType(PrimitiveTypeEnum.Char);
    static String: PrimitiveType = new PrimitiveType(PrimitiveTypeEnum.String);
    static I8: PrimitiveType = new PrimitiveType(PrimitiveTypeEnum.I8);
    static I16: PrimitiveType = new PrimitiveType(PrimitiveTypeEnum.I16);
    static I32: PrimitiveType = new PrimitiveType(PrimitiveTypeEnum.I32);
    static I64: PrimitiveType = new PrimitiveType(PrimitiveTypeEnum.I64);
    static U8: PrimitiveType = new PrimitiveType(PrimitiveTypeEnum.U8);
    static U16: PrimitiveType = new PrimitiveType(PrimitiveTypeEnum.U16);
    static U32: PrimitiveType = new PrimitiveType(PrimitiveTypeEnum.U32);
    static U64: PrimitiveType = new PrimitiveType(PrimitiveTypeEnum.U64);
    static F32: PrimitiveType = new PrimitiveType(PrimitiveTypeEnum.F32);
    static F64: PrimitiveType = new PrimitiveType(PrimitiveTypeEnum.F64);

    private constructor(public readonly value: PrimitiveTypeEnum) {}
}
export function isPrimitiveType(
    value:
        | ProductMember
        | VoidType
        | PrimitiveType
        | EnumType
        | SumType
        | ProductType
        | TupleType
        | MapType
        | SetType
        | SequenceType
        | OptionType
        | NamedTypeReference
): value is PrimitiveType {
    return value.discriminator === Discriminator.PrimitiveType;
}

export class EnumType {
    readonly discriminator = Discriminator.EnumType;

    public members: StringElement[];

    constructor(init: { members: StringElement[] }) {
        this.members = init.members;
    }
}
export function isEnumType(
    value:
        | ProductMember
        | VoidType
        | PrimitiveType
        | EnumType
        | SumType
        | ProductType
        | TupleType
        | MapType
        | SetType
        | SequenceType
        | OptionType
        | NamedTypeReference
): value is EnumType {
    return value.discriminator === Discriminator.EnumType;
}

export type StringElement = Id;

export type TypeWithStructure = SumType | ProductType | GenericType;
export function isTypeWithStructure(
    value:
        | ProductMember
        | VoidType
        | PrimitiveType
        | EnumType
        | SumType
        | ProductType
        | TupleType
        | MapType
        | SetType
        | SequenceType
        | OptionType
        | NamedTypeReference
): value is TypeWithStructure {
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

    public members: Type[];

    constructor(init: { members: Type[] }) {
        this.members = init.members;
    }
}
export function isSumType(
    value:
        | ProductMember
        | VoidType
        | PrimitiveType
        | EnumType
        | SumType
        | ProductType
        | TupleType
        | MapType
        | SetType
        | SequenceType
        | OptionType
        | NamedTypeReference
): value is SumType {
    return value.discriminator === Discriminator.SumType;
}

export class ProductType {
    readonly discriminator = Discriminator.ProductType;

    public members: ProductMember[];

    constructor(init: { members: ProductMember[] }) {
        this.members = init.members;
    }
}
export function isProductType(
    value:
        | ProductMember
        | VoidType
        | PrimitiveType
        | EnumType
        | SumType
        | ProductType
        | TupleType
        | MapType
        | SetType
        | SequenceType
        | OptionType
        | NamedTypeReference
): value is ProductType {
    return value.discriminator === Discriminator.ProductType;
}

export class ProductMember {
    readonly discriminator = Discriminator.ProductMember;

    public name: Id;
    public type: Type;

    constructor(init: { name: Id; type: Type }) {
        this.name = init.name;
        this.type = init.type;
    }
}
export function isProductMember(
    value:
        | ProductMember
        | VoidType
        | PrimitiveType
        | EnumType
        | SumType
        | ProductType
        | TupleType
        | MapType
        | SetType
        | SequenceType
        | OptionType
        | NamedTypeReference
): value is ProductMember {
    return value.discriminator === Discriminator.ProductMember;
}

export type GenericType = TupleType | MapType | SetType | SequenceType | OptionType;
export function isGenericType(
    value:
        | ProductMember
        | VoidType
        | PrimitiveType
        | EnumType
        | SumType
        | ProductType
        | TupleType
        | MapType
        | SetType
        | SequenceType
        | OptionType
        | NamedTypeReference
): value is GenericType {
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

    public members: Type[];

    constructor(init: { members: Type[] }) {
        this.members = init.members;
    }
}
export function isTupleType(
    value:
        | ProductMember
        | VoidType
        | PrimitiveType
        | EnumType
        | SumType
        | ProductType
        | TupleType
        | MapType
        | SetType
        | SequenceType
        | OptionType
        | NamedTypeReference
): value is TupleType {
    return value.discriminator === Discriminator.TupleType;
}

export class MapType {
    readonly discriminator = Discriminator.MapType;

    public keyType: Type;
    public valueType: Type;

    constructor(init: { keyType: Type; valueType: Type }) {
        this.keyType = init.keyType;
        this.valueType = init.valueType;
    }
}
export function isMapType(
    value:
        | ProductMember
        | VoidType
        | PrimitiveType
        | EnumType
        | SumType
        | ProductType
        | TupleType
        | MapType
        | SetType
        | SequenceType
        | OptionType
        | NamedTypeReference
): value is MapType {
    return value.discriminator === Discriminator.MapType;
}

export class SetType {
    readonly discriminator = Discriminator.SetType;

    public keyType: Type;

    constructor(init: { keyType: Type }) {
        this.keyType = init.keyType;
    }
}
export function isSetType(
    value:
        | ProductMember
        | VoidType
        | PrimitiveType
        | EnumType
        | SumType
        | ProductType
        | TupleType
        | MapType
        | SetType
        | SequenceType
        | OptionType
        | NamedTypeReference
): value is SetType {
    return value.discriminator === Discriminator.SetType;
}

export class SequenceType {
    readonly discriminator = Discriminator.SequenceType;

    public elementType: Type;

    constructor(init: { elementType: Type }) {
        this.elementType = init.elementType;
    }
}
export function isSequenceType(
    value:
        | ProductMember
        | VoidType
        | PrimitiveType
        | EnumType
        | SumType
        | ProductType
        | TupleType
        | MapType
        | SetType
        | SequenceType
        | OptionType
        | NamedTypeReference
): value is SequenceType {
    return value.discriminator === Discriminator.SequenceType;
}

export class OptionType {
    readonly discriminator = Discriminator.OptionType;

    public type: Type;

    constructor(init: { type: Type }) {
        this.type = init.type;
    }
}
export function isOptionType(
    value:
        | ProductMember
        | VoidType
        | PrimitiveType
        | EnumType
        | SumType
        | ProductType
        | TupleType
        | MapType
        | SetType
        | SequenceType
        | OptionType
        | NamedTypeReference
): value is OptionType {
    return value.discriminator === Discriminator.OptionType;
}

export class NamedTypeReference {
    readonly discriminator = Discriminator.NamedTypeReference;

    public fqn: Fqn;

    constructor(init: { fqn: Fqn }) {
        this.fqn = init.fqn;
    }
}
export function isNamedTypeReference(
    value:
        | ProductMember
        | VoidType
        | PrimitiveType
        | EnumType
        | SumType
        | ProductType
        | TupleType
        | MapType
        | SetType
        | SequenceType
        | OptionType
        | NamedTypeReference
): value is NamedTypeReference {
    return value.discriminator === Discriminator.NamedTypeReference;
}

export type Id = Identifier;

export type Identifier = string;

export type InitialIdentifierChar = string;

export type IdentifierChar = string;

export type Trivia = LineComment | BlockComment | Whitespace;

export class Whitespace {
    readonly discriminator = Discriminator.Whitespace;

    public value: string;

    constructor(init: { value: string }) {
        this.value = init.value;
    }
}
export function isWhitespace(value: LineComment | BlockComment | Whitespace): value is Whitespace {
    return value.discriminator === Discriminator.Whitespace;
}

export class LineComment {
    readonly discriminator = Discriminator.LineComment;

    public value: string;

    constructor(init: { value: string }) {
        this.value = init.value;
    }
}
export function isLineComment(value: LineComment | BlockComment | Whitespace): value is LineComment {
    return value.discriminator === Discriminator.LineComment;
}

export class BlockComment {
    readonly discriminator = Discriminator.BlockComment;

    public value: string;

    constructor(init: { value: string }) {
        this.value = init.value;
    }
}
export function isBlockComment(value: LineComment | BlockComment | Whitespace): value is BlockComment {
    return value.discriminator === Discriminator.BlockComment;
}
