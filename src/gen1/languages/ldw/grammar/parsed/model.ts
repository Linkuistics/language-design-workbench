export enum Discriminator {
    ChoiceRule,
    SequenceRule,
    CountedRuleElement,
    RuleReference,
    StringElement,
    CharSet,
    AnyElement,
    NegativeLookahead,
    LineComment,
    BlockComment,
    Whitespace
}

export class Grammar {
    constructor(
        public names: Name[],
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

export enum RuleAnnotationEnum {
    NoSkip = 1,
    Atomic = 2
}
export class RuleAnnotation {
    static NoSkip: RuleAnnotation = new RuleAnnotation(RuleAnnotationEnum.NoSkip);
    static Atomic: RuleAnnotation = new RuleAnnotation(RuleAnnotationEnum.Atomic);

    private constructor(public readonly value: RuleAnnotationEnum) {}
}

export class PrattRule {
    constructor(
        public name: Name,
        public versionAnnotations: VersionAnnotation[],
        public operators: PrattOperator[],
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

export enum PrattOperatorTypeEnum {
    Prefix = 1,
    Postfix = 2,
    Left = 3,
    Right = 4
}
export class PrattOperatorType {
    static Prefix: PrattOperatorType = new PrattOperatorType(PrattOperatorTypeEnum.Prefix);
    static Postfix: PrattOperatorType = new PrattOperatorType(PrattOperatorTypeEnum.Postfix);
    static Left: PrattOperatorType = new PrattOperatorType(PrattOperatorTypeEnum.Left);
    static Right: PrattOperatorType = new PrattOperatorType(PrattOperatorTypeEnum.Right);

    private constructor(public readonly value: PrattOperatorTypeEnum) {}
}

export class VersionAnnotation {
    constructor(
        public type: VersionAnnotationType,
        public version: VersionNumber
    ) {}
}

export enum VersionAnnotationTypeEnum {
    Enabled = 1,
    Disabled = 2
}
export class VersionAnnotationType {
    static Enabled: VersionAnnotationType = new VersionAnnotationType(VersionAnnotationTypeEnum.Enabled);
    static Disabled: VersionAnnotationType = new VersionAnnotationType(VersionAnnotationTypeEnum.Disabled);

    private constructor(public readonly value: VersionAnnotationTypeEnum) {}
}

export type VersionNumber = VersionSegment[];

export type VersionSegment = string;

export type RuleBody = ChoiceRule | SequenceRule;
export function isRuleBody(
    value: RuleReference | StringElement | CharSet | AnyElement | ChoiceRule | SequenceRule
): value is RuleBody {
    switch (value.discriminator) {
        case Discriminator.ChoiceRule:
        case Discriminator.SequenceRule:
            return true;
        default:
            return false;
    }
}

export class ChoiceRule {
    readonly discriminator = Discriminator.ChoiceRule;

    constructor(public choices: SequenceRule[]) {}
}
export function isChoiceRule(
    value: ChoiceRule | SequenceRule | RuleReference | StringElement | CharSet | AnyElement
): value is ChoiceRule {
    return value.discriminator === Discriminator.ChoiceRule;
}

export class SequenceRule {
    readonly discriminator = Discriminator.SequenceRule;

    constructor(public elements: RuleElement[]) {}
}
export function isSequenceRule(
    value: ChoiceRule | SequenceRule | RuleReference | StringElement | CharSet | AnyElement
): value is SequenceRule {
    return value.discriminator === Discriminator.SequenceRule;
}

export type RuleElement = CountedRuleElement | NegativeLookahead;

export class CountedRuleElement {
    readonly discriminator = Discriminator.CountedRuleElement;

    constructor(
        public label: Label | undefined,
        public countableRuleElement: CountableRuleElement,
        public count: Count | undefined,
        public versionAnnotations: VersionAnnotation[]
    ) {}
}
export function isCountedRuleElement(value: CountedRuleElement | NegativeLookahead): value is CountedRuleElement {
    return value.discriminator === Discriminator.CountedRuleElement;
}

export type CountableRuleElement = RuleReference | StringElement | CharSet | AnyElement | RuleBody;

export enum CountEnum {
    OneOrMore = 1,
    ZeroOrMore = 2,
    Optional = 3
}
export class Count {
    static OneOrMore: Count = new Count(CountEnum.OneOrMore);
    static ZeroOrMore: Count = new Count(CountEnum.ZeroOrMore);
    static Optional: Count = new Count(CountEnum.Optional);

    private constructor(public readonly value: CountEnum) {}
}

export type Label = Name;

export type Name = Identifier;

export class RuleReference {
    readonly discriminator = Discriminator.RuleReference;

    constructor(public names: Name[]) {}
}
export function isRuleReference(
    value: RuleReference | StringElement | CharSet | AnyElement | ChoiceRule | SequenceRule
): value is RuleReference {
    return value.discriminator === Discriminator.RuleReference;
}

export class StringElement {
    readonly discriminator = Discriminator.StringElement;

    constructor(public value: string) {}
}
export function isStringElement(
    value: RuleReference | StringElement | CharSet | AnyElement | ChoiceRule | SequenceRule
): value is StringElement {
    return value.discriminator === Discriminator.StringElement;
}

export class CharSet {
    readonly discriminator = Discriminator.CharSet;

    constructor(
        public negated: boolean,
        public startChars: CharSetChar[],
        public endChars: (CharSetChar | undefined)[]
    ) {}
}
export function isCharSet(
    value: RuleReference | StringElement | CharSet | AnyElement | ChoiceRule | SequenceRule
): value is CharSet {
    return value.discriminator === Discriminator.CharSet;
}

export type CharSetChar = string;

export class AnyElement {
    readonly discriminator = Discriminator.AnyElement;
}
export function isAnyElement(
    value: RuleReference | StringElement | CharSet | AnyElement | ChoiceRule | SequenceRule
): value is AnyElement {
    return value.discriminator === Discriminator.AnyElement;
}

export class NegativeLookahead {
    readonly discriminator = Discriminator.NegativeLookahead;

    constructor(public content: CharSet | StringElement) {}
}
export function isNegativeLookahead(value: CountedRuleElement | NegativeLookahead): value is NegativeLookahead {
    return value.discriminator === Discriminator.NegativeLookahead;
}

export type Identifier = string;

export type Trivia = LineComment | BlockComment | Whitespace;

export class LineComment {
    readonly discriminator = Discriminator.LineComment;

    constructor(public value: string) {}
}
export function isLineComment(value: LineComment | BlockComment | Whitespace): value is LineComment {
    return value.discriminator === Discriminator.LineComment;
}

export class BlockComment {
    readonly discriminator = Discriminator.BlockComment;

    constructor(public value: string) {}
}
export function isBlockComment(value: LineComment | BlockComment | Whitespace): value is BlockComment {
    return value.discriminator === Discriminator.BlockComment;
}

export class Whitespace {
    readonly discriminator = Discriminator.Whitespace;

    constructor(public value: string) {}
}
export function isWhitespace(value: LineComment | BlockComment | Whitespace): value is Whitespace {
    return value.discriminator === Discriminator.Whitespace;
}
