pub struct Model {
    pub r#name: Fqn,
    pub r#parentName: Option<Fqn>,
    pub r#values: Vec<()>,
}

pub type Fqn = Vec<Id>;

pub struct Definition {
    pub r#name: Id,
    pub r#type: Type,
}

pub struct Deletion {
    pub r#name: Id,
}

pub struct MemberModification {
    pub r#name: Id,
    pub r#values: Vec<()>,
}

pub struct MemberDeletion {
    pub r#name: Id,
}

pub struct MemberAddition {
    pub r#value: (),
}

pub type Type = ();

pub struct VoidType {}

pub enum PrimitiveType {
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
    F64,
}

pub struct EnumType {
    pub r#members: Vec<StringElement>,
}

pub type StringElement = Id;

pub type TypeWithStructure = ();

pub struct SumType {
    pub r#members: Vec<Type>,
}

pub struct ProductType {
    pub r#members: Vec<ProductMember>,
}

pub struct ProductMember {
    pub r#name: Id,
    pub r#type: Type,
}

pub type GenericType = ();

pub struct TupleType {
    pub r#members: Vec<Type>,
}

pub struct MapType {
    pub r#keyType: Type,
    pub r#valueType: Type,
}

pub struct SetType {
    pub r#keyType: Type,
}

pub struct SequenceType {
    pub r#elementType: Type,
}

pub struct OptionType {
    pub r#type: Type,
}

pub struct NamedTypeReference {
    pub r#fqn: Fqn,
}

pub type Id = Identifier;

pub type Identifier = string;

pub type InitialIdentifierChar = string;

pub type IdentifierChar = string;

pub type Trivia = ();

pub struct Whitespace {
    pub r#value: string,
}

pub struct LineComment {
    pub r#value: string,
}

pub struct BlockComment {
    pub r#value: string,
}
