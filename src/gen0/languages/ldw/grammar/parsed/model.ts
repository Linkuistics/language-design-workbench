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
    public annotation: RuleAnnotation | undefined;
    public versionAnnotations: VersionAnnotation[];
    public body: RuleBody;

    constructor(init: {
        name: Name;
        annotation: RuleAnnotation | undefined;
        versionAnnotations: VersionAnnotation[];
        body: RuleBody;
    }) {
        this.name = init.name;
        this.annotation = init.annotation;
        this.versionAnnotations = init.versionAnnotations;
        this.body = init.body;
    }
}

export enum RuleAnnotation {
    NoSkip = 1,
    Atomic = 2
}

export class PrattRule {
    public name: Name;
    public versionAnnotations: VersionAnnotation[];
    public operators: PrattOperator[];
    public primary: PrattPrimary;

    constructor(init: {
        name: Name;
        versionAnnotations: VersionAnnotation[];
        operators: PrattOperator[];
        primary: PrattPrimary;
    }) {
        this.name = init.name;
        this.versionAnnotations = init.versionAnnotations;
        this.operators = init.operators;
        this.primary = init.primary;
    }
}

export class PrattOperator {
    public type: PrattOperatorType;
    public name: Name;
    public versionAnnotations: VersionAnnotation[];
    public body: RuleBody;

    constructor(init: {
        type: PrattOperatorType;
        name: Name;
        versionAnnotations: VersionAnnotation[];
        body: RuleBody;
    }) {
        this.type = init.type;
        this.name = init.name;
        this.versionAnnotations = init.versionAnnotations;
        this.body = init.body;
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

export enum PrattOperatorType {
    Prefix = 1,
    Postfix = 2,
    Left = 3,
    Right = 4
}

export class VersionAnnotation {
    public type: VersionAnnotationType;
    public version: VersionNumber;

    constructor(init: { type: VersionAnnotationType; version: VersionNumber }) {
        this.type = init.type;
        this.version = init.version;
    }
}

export enum VersionAnnotationType {
    Enabled = 1,
    Disabled = 2
}

export type VersionNumber = VersionSegment[];

export type VersionSegment = string;

export type RuleBody = ChoiceRule | SequenceRule;

export class ChoiceRule {
    public choices: SequenceRule[];

    constructor(init: { choices: SequenceRule[] }) {
        this.choices = init.choices;
    }
}

export class SequenceRule {
    public elements: RuleElement[];

    constructor(init: { elements: RuleElement[] }) {
        this.elements = init.elements;
    }
}

export type RuleElement = CountedRuleElement | NegativeLookahead;

export class CountedRuleElement {
    public label: Label | undefined;
    public countableRuleElement: CountableRuleElement;
    public count: Count | undefined;
    public versionAnnotations: VersionAnnotation[];

    constructor(init: {
        label?: Label;
        countableRuleElement: CountableRuleElement;
        count?: Count;
        versionAnnotations: VersionAnnotation[];
    }) {
        this.label = init.label;
        this.countableRuleElement = init.countableRuleElement;
        this.count = init.count;
        this.versionAnnotations = init.versionAnnotations;
    }
}

export type CountableRuleElement = RuleReference | StringElement | CharSet | AnyElement | RuleBody;

export enum Count {
    OneOrMore = 1,
    ZeroOrMore = 2,
    Optional = 3
}

export type Label = Name;

export type Name = Identifier;

export class RuleReference {
    public names: Name[];

    constructor(init: { names: Name[] }) {
        this.names = init.names;
    }
}

export class StringElement {
    public value: string;

    constructor(init: { value: string }) {
        this.value = init.value;
    }
}

export class CharSet {
    public negated: boolean;
    public startChars: CharSetChar[];
    public endChars: (CharSetChar | undefined)[];

    constructor(init: { negated: boolean; startChars: CharSetChar[]; endChars: (CharSetChar | undefined)[] }) {
        this.negated = init.negated;
        this.startChars = init.startChars;
        this.endChars = init.endChars;
    }
}

export type CharSetChar = string;

export class AnyElement {}

export class NegativeLookahead {
    public content: CharSet | StringElement;

    constructor(init: { content: CharSet | StringElement }) {
        this.content = init.content;
    }
}

export type Identifier = string;

export type Trivia = LineComment | BlockComment | Whitespace;

export class LineComment {
    public value: string;

    constructor(init: { value: string }) {
        this.value = init.value;
    }
}

export class BlockComment {
    public value: string;

    constructor(init: { value: string }) {
        this.value = init.value;
    }
}

export class Whitespace {
    public value: string;

    constructor(init: { value: string }) {
        this.value = init.value;
    }
}
