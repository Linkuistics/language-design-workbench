import {
    AnyElement,
    CharSet,
    Count,
    Label,
    Name,
    NegativeLookahead,
    PrattOperatorType,
    RuleAnnotation,
    RuleReference,
    StringElement,
    VersionAnnotation
} from '../grammar/model';
export {
    AnyElement,
    CharSet,
    CharSetChar,
    Count,
    Label,
    Name,
    NegativeLookahead,
    PrattOperatorType,
    RuleAnnotation,
    RuleReference,
    StringElement,
    VersionAnnotation,
    VersionAnnotationType,
    VersionNumber,
    VersionSegment
} from '../grammar/model';

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

export type RuleBody = SequenceRule | ChoiceRule | EnumRule | SeparatedByRule;

export class ChoiceRule {
    constructor(public choices: SequenceRule[]) {}
}

export class EnumRule {
    constructor(public members: { name: string; value: string }[]) {}
}

export class SequenceRule {
    constructor(public elements: RuleElement[]) {}
}

export class SeparatedByRule {
    constructor(
        public element: RuleElement,
        public separator: string,
        public minCount: number = 0
    ) {}
}

export type RuleElement = CountedRuleElement | NegativeLookahead;

export class CountedRuleElement {
    constructor(
        public countableRuleElement: CountableRuleElement,
        public label: Label | undefined,
        public count: Count | undefined,
        public versionAnnotations: VersionAnnotation[]
    ) {}
}

export type CountableRuleElement = RuleReference | StringElement | CharSet | AnyElement | RuleBody;
