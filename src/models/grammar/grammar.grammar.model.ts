type Option<T> = T | undefined;


export class Grammar {
    constructor(
        public name:Name,
        public rule:Array<Rule>,
        public prattRule:Array<PrattRule>
    ) {}
}

export class Rule {
    constructor(
        public name:Name,
        public annotation:Option<RuleAnnotation>,
        public versionAnnotation:Array<VersionAnnotation>,
        public body:RuleBody
    ) {}
}

export enum RuleAnnotation {    NoSkip,    Atomic,}

export class PrattRule {
    constructor(
        public name:Name,
        public versionAnnotation:Array<VersionAnnotation>,
        public operator:Array<PrattOperator>,
        public primary:PrattPrimary
    ) {}
}

export class PrattOperator {
    constructor(
        public type:PrattOperatorType,
        public name:Name,
        public versionAnnotation:Array<VersionAnnotation>,
        public body:RuleBody
    ) {}
}

export class PrattPrimary {
    constructor(
        public name:Name,
        public body:RuleBody
    ) {}
}

export enum PrattOperatorType {    Prefix,    Postfix,    Left,    Right,}

export class VersionAnnotation {
    constructor(
        public versionAnnotationType:VersionAnnotationType,
        public versionNumber:VersionNumber
    ) {}
}

export enum VersionAnnotationType {    Enabled,    Disabled,}

export class VersionNumber {
    constructor(
        public segment:VersionSegment,
        public segment:Array<VersionSegment>
    ) {}
}

export class VersionSegment {
    constructor(
        public value:string
    ) {}
}

export class RuleBody {
    constructor(
        public choiceRule:ChoiceRule,
        public sequenceRule:SequenceRule
    ) {}
}

export class ChoiceRule {
    constructor(
        public choice:SequenceRule,
        public choice:Array<SequenceRule>
    ) {}
}

export class SequenceRule {
    constructor(
        public element:Array<RuleElement>
    ) {}
}

export class RuleElement {
    constructor(
        public countedRuleElement:CountedRuleElement,
        public negativeLookahead:NegativeLookahead
    ) {}
}

export class CountedRuleElement {
    constructor(
        public label:Option<Label>,
        public countableRuleElement:CountableRuleElement,
        public count:Option<Count>,
        public versionAnnotation:Array<VersionAnnotation>
    ) {}
}

export class CountableRuleElement {
    constructor(
        public ruleReference:RuleReference,
        public stringElement:StringElement,
        public charSet:CharSet,
        public anyElement:AnyElement,
        public ruleBody:RuleBody
    ) {}
}

export enum Count {    OneOrMore,    ZeroOrMore,    Optional,}

export class Label {
    constructor(
        public name:Name
    ) {}
}

export class Name {
    constructor(
        public identifier:Identifier
    ) {}
}

export class RuleReference {
    constructor(
        public name:Name,
        public name:Array<Name>
    ) {}
}

export class StringElement {
    constructor(
        public value:string
    ) {}
}

export class CharSet {
    constructor(
        public negated:boolean,
        public range:Array<{ startChar:CharSetChar, endChar:Option<CharSetChar> }>
    ) {}
}

export class CharSetChar {
    constructor(
        public value:string
    ) {}
}

export class AnyElement {
}

export class NegativeLookahead {
    constructor(
        public content:CharSet,
        public content:string
    ) {}
}

export class Identifier {
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

export class Whitespace {
    constructor(
        public value:string
    ) {}
}