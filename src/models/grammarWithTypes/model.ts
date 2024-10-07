import { Definition, ProductMember, Type } from '../model/model';

import * as In from '../../models/grammar/model';
export {
    CharSetChar,
    Count,
    Label,
    Name,
    PrattOperatorType,
    VersionAnnotation,
    VersionAnnotationType,
    VersionNumber,
    VersionSegment
} from '../../models/grammar/model';

export class Grammar {
    constructor(
        public name: In.Name,
        public rules: Rule[],
        public prattRules: PrattRule[],
        public definitions: Definition[]
    ) {}
}

export class Rule {
    constructor(
        public name: In.Name,
        public body: RuleBody,
        public noSkip: boolean,
        public atomic: boolean,
        public versionAnnotations: In.VersionAnnotation[],
        public type: Type
    ) {}
}

export class PrattRule {
    constructor(
        public name: In.Name,
        public operators: PrattOperator[],
        public primary: PrattPrimary,
        public versionAnnotations: In.VersionAnnotation[]
    ) {}
}

export class PrattOperator {
    constructor(
        public type: In.PrattOperatorType,
        public name: In.Name,
        public body: RuleBody,
        public versionAnnotations: In.VersionAnnotation[]
    ) {}
}

export class PrattPrimary {
    constructor(
        public name: In.Name,
        public body: RuleBody
    ) {}
}

export class ChoiceRule {
    constructor(public choices: SequenceRule[]) {}
}

export class SequenceRule {
    constructor(public elements: RuleElement[]) {}
}

export class CountedRuleElement {
    constructor(
        public countableRuleElement: CountableRuleElement,
        // public label: In.Label | undefined,
        public count: In.Count | undefined,
        public versionAnnotations: In.VersionAnnotation[]
    ) {}
}

export class CharSet {
    constructor(
        public negated: boolean,
        public ranges: {
            startChar: In.CharSetChar;
            endChar?: In.CharSetChar;
        }[],
        public field?: ProductMember
    ) {}
}

export class NegativeLookahead {
    constructor(public content: CharSet | StringElement) {}
}

export class RuleReference {
    constructor(
        public names: In.Name[],
        public field?: ProductMember
    ) {}
}

export class StringElement {
    constructor(
        public value: string,
        public field?: ProductMember
    ) {}
}

export class AnyElement {
    constructor(public field?: ProductMember) {}
}

export type RuleBody = SequenceRule | ChoiceRule;
export type CountableRuleElement =
    | RuleReference
    | StringElement
    | CharSet
    | AnyElement
    | RuleBody;
export type RuleElement = CountedRuleElement | NegativeLookahead;
