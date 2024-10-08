type Option<T> = T | undefined;


export class Model {
    constructor(
        public name:Id,
        public parentName:Option<Id>,
        public deletion:Array<Deletion>,
        public memberModification:Array<MemberModification>,
        public definition:Array<Definition>
    ) {}
}

export class Definition {
    constructor(
        public name:Id,
        public type:Type
    ) {}
}

export class Deletion {
    constructor(
        public name:Id
    ) {}
}

export class MemberModification {
    constructor(
        public name:Id,
        public memberDeletion:Array<MemberDeletion>,
        public memberAddition:Array<MemberAddition>
    ) {}
}

export class MemberDeletion {
    constructor(
        public name:Id
    ) {}
}

export class MemberAddition {
    constructor(
        public productMember:ProductMember,
        public type:Type
    ) {}
}

export class Type {
    constructor(
        public voidType:VoidType,
        public primitiveType:PrimitiveType,
        public enumType:EnumType,
        public typeWithStructure:TypeWithStructure,
        public namedTypeReference:NamedTypeReference
    ) {}
}

export class VoidType {
}

export enum PrimitiveType {    Boolean,    Char,    String,    I8,    I16,    I32,    I64,    U8,    U16,    U32,    U64,    F32,    F64,}

export class EnumType {
    constructor(
        public member:String,
        public member:Array<String>
    ) {}
}

export class String {
    constructor(
        public id:Id
    ) {}
}

export class TypeWithStructure {
    constructor(
        public sumType:SumType,
        public productType:ProductType,
        public genericType:GenericType
    ) {}
}

export class SumType {
    constructor(
        public member:Type,
        public member:Array<Type>
    ) {}
}

export class ProductType {
    constructor(
        public member:Option<ProductMember>,
        public member:Array<ProductMember>
    ) {}
}

export class ProductMember {
    constructor(
        public name:Id,
        public type:Type
    ) {}
}

export class GenericType {
    constructor(
        public tupleType:TupleType,
        public mapType:MapType,
        public setType:SetType,
        public sequenceType:SequenceType,
        public optionType:OptionType
    ) {}
}

export class TupleType {
    constructor(
        public member:Type,
        public member:Array<Type>
    ) {}
}

export class MapType {
    constructor(
        public keyType:Type,
        public valueType:Type
    ) {}
}

export class SetType {
    constructor(
        public keyType:Type
    ) {}
}

export class SequenceType {
    constructor(
        public elementType:Type
    ) {}
}

export class OptionType {
    constructor(
        public type:Type
    ) {}
}

export class NamedTypeReference {
    constructor(
        public name:Id,
        public name:Array<Id>
    ) {}
}

export class Id {
    constructor(
        public identifier:Identifier
    ) {}
}

export class Identifier {
    constructor(
        public value:string
    ) {}
}

export class InitialIdentifierChar {
    constructor(
        public value:string
    ) {}
}

export class IdentifierChar {
    constructor(
        public value:string
    ) {}
}

export class Trivia {
    constructor(
        public lineComment:LineComment,
        public blockComment:BlockComment,
        public whitespace:Whitespace
    ) {}
}

export class Whitespace {
    constructor(
        public value:string
    ) {}
}

export class LineComment {
    constructor(
        public value:string
    ) {}
}

export class BlockComment {
    constructor(
        public value:string
    ) {}
}