import { Definition, Type } from '../../model/parsed/model';

import { CharSetChar, Count, Name, PrattOperatorType, RuleAnnotation, VersionAnnotation } from '../extended/model';
export {
    CharSetChar,
    Count,
    Label,
    Name,
    PrattOperatorType,
    RuleAnnotation,
    VersionAnnotation,
    VersionAnnotationType,
    VersionNumber,
    VersionSegment
} from '../extended/model';

export class Field {
    constructor(
        public type: Type,
        public name?: string,
        public isExplicit: boolean = false
    ) {}
}

export class Grammar {
    constructor(
        public name: Name[],
        public rules: Rule[],
        public prattRules: PrattRule[],
        public definitions: Definition[]
    ) {}
}

export class Rule {
    constructor(
        public name: Name,
        public body: RuleBody,
        public annotation: RuleAnnotation | undefined,
        public versionAnnotations: VersionAnnotation[],
        public type: Type
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
    constructor(
        public members: { name: string; value: string }[],
        public field?: Field
    ) {}
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
        public count: Count | undefined,
        public versionAnnotations: VersionAnnotation[]
    ) {}
}

export type CountableRuleElement = RuleReference | StringElement | CharSet | AnyElement | RuleBody;

export class RuleReference {
    constructor(
        public names: Name[],
        public field?: Field
    ) {}
}

export class StringElement {
    constructor(
        public value: string,
        public field?: Field
    ) {}
}

export class CharSet {
    constructor(
        public negated: boolean,
        public startChars: CharSetChar[],
        public endChars: (CharSetChar | undefined)[],
        public field?: Field
    ) {}
}

export class AnyElement {
    constructor(public field?: Field) {}
}

export class NegativeLookahead {
    constructor(public content: CharSet | StringElement) {}
}
