export type CharSetChar = string;
export type CountableRuleElement = RuleReference | String | CharSet | Any | RuleBody;
export type Label = string;
export type Name = string;
export type RuleBody = SequenceRule | AlternativeRules;
export type RuleElement = CountedRuleElement | NegativeLookahead;
export type Trivia = LineComment | BlockComment | Whitespace;
export type VersionSegment = string;

export enum Count {
    OneOrMore,
    ZeroOrMore,
    Optional
}

export enum PrattOperatorType {
    Prefix,
    Postfix,
    Left,
    Right
}

export enum RuleAnnotation {
    NoSkip,
    Atomic
}

export enum VersionAnnotationType {
    Enabled,
    Disabled
}

export class Alternative {
    constructor(
        public label: Label | undefined,
        public versionAnnotations: VersionAnnotation[],
        public sequenceRule: SequenceRule
    ) {}
}

export class AlternativeRules {
    constructor(
        public alternatives: Alternative[]
    ) {}
}

export class Any {}

export class BlockComment {
    constructor(
        public value: string
    ) {}
}

export class CharSet {
    constructor(
        public negated: boolean,
        public ranges: { startChar: CharSetChar, endChar: CharSetChar | undefined }[]
    ) {}
}

export class CountedRuleElement {
    constructor(
        public label: Label | undefined,
        public countableRuleElement: CountableRuleElement,
        public count: Count | undefined,
        public versionAnnotations: VersionAnnotation[]
    ) {}
}

export class Grammar {
    constructor(
        public name: Name,
        public rules: (Rule | PrattRule | IdentifierRule)[]
    ) {}
}

export class IdentifierRule {
    constructor(
        public name: Name,
        public ruleAnnotation: RuleAnnotation | undefined,
        public versionAnnotations: VersionAnnotation[],
        public value: IdentifierWithExclusions | RuleBody
    ) {}
}

export class IdentifierWithExclusions {
    constructor(
        public ruleBodies: RuleBody[]
    ) {}
}

export class LineComment {
    constructor(
        public value: string
    ) {}
}

export class NegativeLookahead {
    constructor(
        public value: CharSet | String
    ) {}
}

export class PrattOperator {
    constructor(
        public prattOperatorType: PrattOperatorType,
        public name: Name,
        public versionAnnotations: VersionAnnotation[],
        public body: RuleBody
    ) {}
}

export class PrattPrimary {
    constructor(
        public name: Name,
        public body: RuleBody
    ) {}
}

export class PrattRule {
    constructor(
        public name: Name,
        public versionAnnotations: VersionAnnotation[],
        public operators: PrattOperator[],
        public primary: PrattPrimary
    ) {}
}

export class Rule {
    constructor(
        public name: Name,
        public annotation: RuleAnnotation | undefined,
        public versionAnnotations: VersionAnnotation[],
        public body: RuleBody
    ) {}
}

export class RuleReference {
    constructor(
        public names: Name[]
    ) {}
}

export class SequenceRule {
    constructor(
        public ruleElements: RuleElement[]
    ) {}
}

export class String {
    constructor(
        public value: string
    ) {}
}

export class VersionAnnotation {
    constructor(
        public versionAnnotationType: VersionAnnotationType,
        public versionNumber: VersionNumber
    ) {}
}

export class VersionNumber {
    constructor(
        public segments: VersionSegment[]
    ) {}
}

export class Whitespace {
    constructor(
        public value: string
    ) {}
}
