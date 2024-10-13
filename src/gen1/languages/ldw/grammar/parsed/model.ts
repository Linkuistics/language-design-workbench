export class AnyElement {}

export class BlockComment {
    constructor(public value: string) {}
}

export class CharSet {
    constructor(
        public negated: boolean | undefined,
        public startChars: CharSetChar[],
        public endChars: (CharSetChar | undefined)[]
    ) {}
}

export type CharSetChar = string;

export class ChoiceRule {
    constructor(public choices: SequenceRule[]) {}
}

export enum Count {
    OneOrMore = 1,
    ZeroOrMore = 2,
    Optional = 3
}

export type CountableRuleElement = RuleReference | StringElement | CharSet | AnyElement | RuleBody;

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
        public names: Name[],
        public rules: Rule[],
        public prattRules: PrattRule[]
    ) {}
}

export type Identifier = string;

export type Label = Name;

export class LineComment {
    constructor(public value: string) {}
}

export type Name = Identifier;

export class NegativeLookahead {
    constructor(public content: CharSet | StringElement) {}
}

export class PrattOperator {
    constructor(
        public type: PrattOperatorType,
        public name: Name,
        public versionAnnotations: VersionAnnotation[],
        public body: RuleBody
    ) {}
}

export enum PrattOperatorType {
    Prefix = 1,
    Postfix = 2,
    Left = 3,
    Right = 4
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

export enum RuleAnnotation {
    NoSkip = 1,
    Atomic = 2
}

export type RuleBody = ChoiceRule | SequenceRule;

export type RuleElement = CountedRuleElement | NegativeLookahead;

export class RuleReference {
    constructor(public names: Name[]) {}
}

export class SequenceRule {
    constructor(public elements: RuleElement[]) {}
}

export class StringElement {
    constructor(public value: string) {}
}

export type Trivia = LineComment | BlockComment | Whitespace;

export class VersionAnnotation {
    constructor(
        public type: VersionAnnotationType,
        public version: VersionNumber
    ) {}
}

export enum VersionAnnotationType {
    Enabled = 1,
    Disabled = 2
}

export type VersionNumber = VersionSegment[];

export type VersionSegment = string;

export class Whitespace {
    constructor(public value: string) {}
}
