export class GrammarLanguage {
    constructor(public grammar: Grammar) {}
}

export class Grammar {
    constructor(
        public name: Name,
        public rules: (Rule | PrattRule | IdentifierRule)[]
    ) {}
}

export class Rule {
    constructor(
        public name: Name,
        public body: RuleBody,
        public annotation: RuleAnnotation | undefined,
        public versionAnnotations: VersionAnnotation[]
    ) {}
}

export class PrattRule {
    constructor(
        public name: Name,
        public operators: PrattOperator[],
        public primary: PrattPrimary,
        public versionAnnotations: VersionAnnotation[]
    ) {}
}

export class PrattOperator {
    constructor(
        public type: PrattOperatorType,
        public name: Name,
        public body: RuleBody,
        public versionAnnotations: VersionAnnotation[]
    ) {}
}

export class PrattPrimary {
    constructor(
        public name: Name,
        public body: RuleBody
    ) {}
}

export class IdentifierRule {
    constructor(
        public name: Name,
        public ruleBodies: RuleBody[],
        public ruleAnnotation: RuleAnnotation | undefined,
        public versionAnnotations: VersionAnnotation[]
    ) {}
}

export class VersionAnnotation {
    constructor(
        public type: VersionAnnotationType,
        public version: VersionNumber
    ) {}
}

export class VersionNumber {
    constructor(public segments: VersionSegment[]) {}
}

export class AlternativeRules {
    constructor(public alternatives: AlternativeRule[]) {}
}

export class AlternativeRule {
    constructor(
        public sequenceRule: SequenceRule,
        public label: Label | undefined,
        public versionAnnotations: VersionAnnotation[]
    ) {}
}

export class SequenceRule {
    constructor(public elements: RuleElement[]) {}
}

export class CountedRuleElement {
    constructor(
        public countableRuleElement: CountableRuleElement,
        public label: Label | undefined,
        public count: Count | undefined,
        public versionAnnotations: VersionAnnotation[]
    ) {}
}

export class CharSet {
    constructor(
        public negated: boolean,
        public ranges: { startChar: CharSetChar; endChar?: CharSetChar }[]
    ) {}
}

export class NegativeLookahead {
    constructor(public content: CharSet | StringElement) {}
}

export class RuleReference {
    constructor(public names: Name[]) {}
}

export class StringElement {
    constructor(public value: string) {}
}

export class AnyElement {}

export enum RuleAnnotation {
    NoSkip = '@noskip',
    Atomic = '@atomic'
}

export enum PrattOperatorType {
    Prefix = 'prefix',
    Postfix = 'postfix',
    Left = 'left',
    Right = 'right'
}

export enum VersionAnnotationType {
    Enabled = '@enabled',
    Disabled = '@disabled'
}

export enum Count {
    OneOrMore = '+',
    ZeroOrMore = '*',
    Optional = '?'
}

export type Name = string;
export type Label = string;
export type CharSetChar = string;
export type VersionSegment = string;
export type RuleBody = SequenceRule | AlternativeRules;
export type CountableRuleElement =
    | RuleReference
    | StringElement
    | CharSet
    | AnyElement
    | RuleBody;
export type RuleElement = CountedRuleElement | NegativeLookahead;
