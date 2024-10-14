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
    public type: Type;
    public name?: string;
    public isExplicit: boolean;

    constructor(init: { type: Type; name?: string; isExplicit?: boolean }) {
        this.type = init.type;
        this.name = init.name;
        this.isExplicit = init.isExplicit ?? false;
    }
}

export class Grammar {
    public name: Name[];
    public rules: Rule[];
    public prattRules: PrattRule[];
    public definitions: Definition[];

    constructor(init: { name: Name[]; rules: Rule[]; prattRules: PrattRule[]; definitions: Definition[] }) {
        this.name = init.name;
        this.rules = init.rules;
        this.prattRules = init.prattRules;
        this.definitions = init.definitions;
    }
}

export class Rule {
    public name: Name;
    public body: RuleBody;
    public annotation: RuleAnnotation | undefined;
    public versionAnnotations: VersionAnnotation[];
    public type: Type;

    constructor(init: {
        name: Name;
        body: RuleBody;
        annotation: RuleAnnotation | undefined;
        versionAnnotations: VersionAnnotation[];
        type: Type;
    }) {
        this.name = init.name;
        this.body = init.body;
        this.annotation = init.annotation;
        this.versionAnnotations = init.versionAnnotations;
        this.type = init.type;
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
    public members: { name: string; value: string }[];
    public field?: Field;

    constructor(init: { members: { name: string; value: string }[]; field?: Field }) {
        this.members = init.members;
        this.field = init.field;
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
    public count: Count | undefined;
    public versionAnnotations: VersionAnnotation[];

    constructor(init: {
        countableRuleElement: CountableRuleElement;
        count?: Count;
        versionAnnotations: VersionAnnotation[];
    }) {
        this.countableRuleElement = init.countableRuleElement;
        this.count = init.count;
        this.versionAnnotations = init.versionAnnotations;
    }
}

export type CountableRuleElement = RuleReference | StringElement | CharSet | AnyElement | RuleBody;

export class RuleReference {
    public names: Name[];
    public field?: Field;

    constructor(init: { names: Name[]; field?: Field }) {
        this.names = init.names;
        this.field = init.field;
    }
}

export class StringElement {
    public value: string;
    public field?: Field;

    constructor(init: { value: string; field?: Field }) {
        this.value = init.value;
        this.field = init.field;
    }
}

export class CharSet {
    public negated: boolean;
    public startChars: CharSetChar[];
    public endChars: (CharSetChar | undefined)[];
    public field?: Field;

    constructor(init: {
        negated: boolean;
        startChars: CharSetChar[];
        endChars: (CharSetChar | undefined)[];
        field?: Field;
    }) {
        this.negated = init.negated;
        this.startChars = init.startChars;
        this.endChars = init.endChars;
        this.field = init.field;
    }
}

export class AnyElement {
    public field?: Field;

    constructor(init: { field?: Field }) {
        this.field = init.field;
    }
}

export class NegativeLookahead {
    public content: CharSet | StringElement;

    constructor(init: { content: CharSet | StringElement }) {
        this.content = init.content;
    }
}
