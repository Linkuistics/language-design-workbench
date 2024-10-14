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
} from '../parsed/model';
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
} from '../parsed/model';

export class Grammar {
    public names: Name[];
    public rules: Rule[];
    public prattRules: PrattRule[];

    constructor(init: { names: Name[]; rules: Rule[]; prattRules: PrattRule[] }) {
        this.names = init.names;
        this.rules = init.rules;
        this.prattRules = init.prattRules;
    }
}

export class Rule {
    public name: Name;
    public body: RuleBody;
    public annotation: RuleAnnotation | undefined;
    public versionAnnotations: VersionAnnotation[];

    constructor(init: {
        name: Name;
        body: RuleBody;
        annotation: RuleAnnotation | undefined;
        versionAnnotations: VersionAnnotation[];
    }) {
        this.name = init.name;
        this.body = init.body;
        this.annotation = init.annotation;
        this.versionAnnotations = init.versionAnnotations;
    }
}

export class PrattRule {
    public name: Name;
    public operators: PrattOperator[];
    public primary: PrattPrimary;
    public versionAnnotations: VersionAnnotation[];

    constructor(init: {
        name: Name;
        operators: PrattOperator[];
        primary: PrattPrimary;
        versionAnnotations: VersionAnnotation[];
    }) {
        this.name = init.name;
        this.operators = init.operators;
        this.primary = init.primary;
        this.versionAnnotations = init.versionAnnotations;
    }
}

export class PrattOperator {
    public type: PrattOperatorType;
    public name: Name;
    public body: RuleBody;
    public versionAnnotations: VersionAnnotation[];

    constructor(init: {
        type: PrattOperatorType;
        name: Name;
        body: RuleBody;
        versionAnnotations: VersionAnnotation[];
    }) {
        this.type = init.type;
        this.name = init.name;
        this.body = init.body;
        this.versionAnnotations = init.versionAnnotations;
    }
}

export class PrattPrimary {
    public name: Name;
    public body: RuleBody;

    constructor(init: { name: Name; body: RuleBody }) {
        this.name = init.name;
        this.body = init.body;
    }
}

export type RuleBody = SequenceRule | ChoiceRule | EnumRule | SeparatedByRule;

export class ChoiceRule {
    public choices: SequenceRule[];

    constructor(init: { choices: SequenceRule[] }) {
        this.choices = init.choices;
    }
}

export class EnumRule {
    public members: string[];

    constructor(init: { members: string[] }) {
        this.members = init.members;
    }
}

export class SequenceRule {
    public elements: RuleElement[];

    constructor(init: { elements: RuleElement[] }) {
        this.elements = init.elements;
    }
}

export class SeparatedByRule {
    public element: RuleElement;
    public separator: string;
    public minCount: number;

    constructor(init: { element: RuleElement; separator: string; minCount?: number }) {
        this.element = init.element;
        this.separator = init.separator;
        this.minCount = init.minCount ?? 0;
    }
}

export type RuleElement = CountedRuleElement | NegativeLookahead;

export class CountedRuleElement {
    public countableRuleElement: CountableRuleElement;
    public label: Label | undefined;
    public count: Count | undefined;
    public versionAnnotations: VersionAnnotation[];

    constructor(init: {
        countableRuleElement: CountableRuleElement;
        label?: Label;
        count?: Count;
        versionAnnotations: VersionAnnotation[];
    }) {
        this.countableRuleElement = init.countableRuleElement;
        this.label = init.label;
        this.count = init.count;
        this.versionAnnotations = init.versionAnnotations;
    }
}

export type CountableRuleElement = RuleReference | StringElement | CharSet | AnyElement | RuleBody;
