export class Grammar {
    constructor(
        public name: Name,
        public rules: Rule[],
        public prattRules: PrattRule[]
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

export enum RuleAnnotation {
    NoSkip,
    Atomic
}

export class PrattRule {
    constructor(
        public name: Name,
        public versionAnnotations: VersionAnnotation[],
        public operator: PrattOperator,
        public primary: PrattPrimary
    ) {}
}

export class PrattOperator {
    constructor(
        public type: PrattOperatorType,
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

export enum PrattOperatorType {
    Prefix,
    Postfix,
    Left,
    Right
}

export class VersionAnnotation {
    constructor(
        public type: VersionAnnotationType,
        public version: VersionNumber
    ) {}
}

export enum VersionAnnotationType {
    Enabled,
    Disabled
}

export type VersionNumber = VersionSegment[];

export type VersionSegment = string;

export type RuleBody = ChoiceRule | SequenceRule;

export class ChoiceRule {
    constructor(public choices: SequenceRule[]) {}
}

export class SequenceRule {
    constructor(public element: RuleElement) {}
}

export type RuleElement = CountedRuleElement | NegativeLookahead;

export class CountedRuleElement {
    constructor(
        public label: Label | undefined,
        public countableRuleElement: CountableRuleElement,
        public count: Count | undefined,
        public versionAnnotations: VersionAnnotation[]
    ) {}
}

export type CountableRuleElement = RuleReference | StringElement | CharSet | AnyElement | RuleBody;

export enum Count {
    OneOrMore,
    ZeroOrMore,
    Optional
}

export type Label = Name;

export type Name = Identifier;

export class RuleReference {
    constructor(public names: Name[]) {}
}

export class StringElement {
    constructor(public value: string) {}
}

export class CharSet {
    constructor(
        public negated: boolean,
        public startChar: CharSetChar,
        public endChar: CharSetChar | undefined
    ) {}
}

export type CharSetChar = string;

export class AnyElement {}

export class NegativeLookahead {
    constructor(public content: CharSet | StringElement) {}
}

export type Identifier = string;

export type Trivia = LineComment | BlockComment | Whitespace;

export class LineComment {
    constructor(public value: string) {}
}

export class BlockComment {
    constructor(public value: string) {}
}

export class Whitespace {
    constructor(public value: string) {}
}
