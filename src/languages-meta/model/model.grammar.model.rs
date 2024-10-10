pub struct Model {
    pub name: Id,
    pub parentName: Option<Id>,
    pub values: Vec<Deletion | MemberModification | Definition>,
}

pub struct Definition {
    pub name: Id,
    pub type: Type,
}

pub struct Deletion {
    pub name: Id,
}

pub struct MemberModification {
    pub name: Id,
    pub values: Vec<MemberDeletion | MemberAddition>,
}

pub struct MemberDeletion {
    pub name: Id,
}

pub struct MemberAddition {
    pub value: ProductMember | Type,
}

pub type Type =VoidType | PrimitiveType | EnumType | TypeWithStructure | NamedTypeReference;

pub struct VoidType {
}

pub enum PrimitiveType {    Boolean,    Char,    String,    I8,    I16,    I32,    I64,    U8,    U16,    U32,    U64,    F32,    F64,}

pub struct EnumType {
    pub members: Vec<StringElement>,
}

pub type StringElement =Id;

pub type TypeWithStructure =SumType | ProductType | GenericType;

pub struct SumType {
    pub members: Vec<Type>,
}

pub struct ProductType {
    pub members: Vec<ProductMember>,
}

pub struct ProductMember {
    pub name: Id,
    pub type: Type,
}

pub type GenericType =TupleType | MapType | SetType | SequenceType | OptionType;

pub struct TupleType {
    pub members: Vec<Type>,
}

pub struct MapType {
    pub keyType: Type,
    pub valueType: Type,
}

pub struct SetType {
    pub keyType: Type,
}

pub struct SequenceType {
    pub elementType: Type,
}

pub struct OptionType {
    pub type: Type,
}

pub struct NamedTypeReference {
    pub names: Vec<Id>,
}

pub type Id =Identifier;

pub type Identifier =String;

pub type InitialIdentifierChar =String;

pub type IdentifierChar =String;

pub type Trivia =LineComment | BlockComment | Whitespace;

pub struct Whitespace {
    pub value: String,
}

pub struct LineComment {
    pub value: String,
}

pub struct BlockComment {
    pub value: String,
}