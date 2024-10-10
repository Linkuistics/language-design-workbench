pub struct Grammar {
    pub name: Name,
    pub rules: Vec<Rule>,
    pub prattRules: Vec<PrattRule>,
}

pub struct Rule {
    pub name: Name,
    pub annotation: Option<RuleAnnotation>,
    pub versionAnnotations: Vec<VersionAnnotation>,
    pub body: RuleBody,
}

pub enum RuleAnnotation {    NoSkip,    Atomic,}

pub struct PrattRule {
    pub name: Name,
    pub versionAnnotations: Vec<VersionAnnotation>,
    pub operators: Vec<PrattOperator>,
    pub primary: PrattPrimary,
}

pub struct PrattOperator {
    pub type: PrattOperatorType,
    pub name: Name,
    pub versionAnnotations: Vec<VersionAnnotation>,
    pub body: RuleBody,
}

pub struct PrattPrimary {
    pub name: Name,
    pub body: RuleBody,
}

pub enum PrattOperatorType {    Prefix,    Postfix,    Left,    Right,}

pub struct VersionAnnotation {
    pub type: VersionAnnotationType,
    pub version: VersionNumber,
}

pub enum VersionAnnotationType {    Enabled,    Disabled,}

pub type VersionNumber =Vec<VersionSegment>;

pub type VersionSegment =String;

pub type RuleBody =ChoiceRule | SequenceRule;

pub struct ChoiceRule {
    pub choices: Vec<SequenceRule>,
}

pub struct SequenceRule {
    pub elements: Vec<RuleElement>,
}

pub type RuleElement =CountedRuleElement | NegativeLookahead;

pub struct CountedRuleElement {
    pub label: Option<Label>,
    pub countableRuleElement: CountableRuleElement,
    pub count: Option<Count>,
    pub versionAnnotations: Vec<VersionAnnotation>,
}

pub type CountableRuleElement =RuleReference | StringElement | CharSet | AnyElement | RuleBody;

pub enum Count {    OneOrMore,    ZeroOrMore,    Optional,}

pub type Label =Name;

pub type Name =Identifier;

pub struct RuleReference {
    pub names: Vec<Name>,
}

pub struct StringElement {
    pub value: String,
}

pub struct CharSet {
    pub negated: boolean,
    pub startChars: Vec<CharSetChar>,
    pub endChars: Vec<Option<CharSetChar>>,
}

pub type CharSetChar =String;

pub struct AnyElement {
}

pub struct NegativeLookahead {
    pub content: CharSet | StringElement,
}

pub type Identifier =String;

pub type Trivia =LineComment | BlockComment | Whitespace;

pub struct LineComment {
    pub value: String,
}

pub struct BlockComment {
    pub value: String,
}

pub struct Whitespace {
    pub value: String,
}