pub struct Grammar {
    pub r#name: Name,
    pub r#rules: Vec<Rule>,
    pub r#prattRules: Vec<PrattRule>,
}

pub struct Rule {
    pub r#name: Name,
    pub r#annotation: Option<RuleAnnotation>,
    pub r#versionAnnotations: Vec<VersionAnnotation>,
    pub r#body: RuleBody,
}

pub enum RuleAnnotation {
    NoSkip,
    Atomic,
}

pub struct PrattRule {
    pub r#name: Name,
    pub r#versionAnnotations: Vec<VersionAnnotation>,
    pub r#operators: Vec<PrattOperator>,
    pub r#primary: PrattPrimary,
}

pub struct PrattOperator {
    pub r#type: PrattOperatorType,
    pub r#name: Name,
    pub r#versionAnnotations: Vec<VersionAnnotation>,
    pub r#body: RuleBody,
}

pub struct PrattPrimary {
    pub r#name: Name,
    pub r#body: RuleBody,
}

pub enum PrattOperatorType {
    Prefix,
    Postfix,
    Left,
    Right,
}

pub struct VersionAnnotation {
    pub r#type: VersionAnnotationType,
    pub r#version: VersionNumber,
}

pub enum VersionAnnotationType {
    Enabled,
    Disabled,
}

pub type VersionNumber = Vec<VersionSegment>;

pub type VersionSegment = String;

pub type RuleBody = ();

pub struct ChoiceRule {
    pub r#choices: Vec<SequenceRule>,
}

pub struct SequenceRule {
    pub r#elements: Vec<RuleElement>,
}

pub type RuleElement = ();

pub struct CountedRuleElement {
    pub r#label: Option<Label>,
    pub r#countableRuleElement: CountableRuleElement,
    pub r#count: Option<Count>,
    pub r#versionAnnotations: Vec<VersionAnnotation>,
}

pub type CountableRuleElement = ();

pub enum Count {
    OneOrMore,
    ZeroOrMore,
    Optional,
}

pub type Label = Name;

pub type Name = Identifier;

pub struct RuleReference {
    pub r#names: Vec<Name>,
}

pub struct StringElement {
    pub r#value: String,
}

pub struct CharSet {
    pub r#negated: boolean,
    pub r#startChars: Vec<CharSetChar>,
    pub r#endChars: Vec<Option<CharSetChar>>,
}

pub type CharSetChar = String;

pub struct AnyElement {}

pub struct NegativeLookahead {
    pub r#content: (),
}

pub type Identifier = String;

pub type Trivia = ();

pub struct LineComment {
    pub r#value: String,
}

pub struct BlockComment {
    pub r#value: String,
}

pub struct Whitespace {
    pub r#value: String,
}
