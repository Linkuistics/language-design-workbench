// Generated on 2024-10-19T22:19:35.751Z
import * as Model from './model';

enum Buildable {
    Grammar,
    Rule,
    PrattRule,
    PrattOperator,
    PrattPrimary,
    VersionAnnotation,
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
    Whitespace,
    EnumRule,
    SeparatedByRule
}

enum GrammarField {
    Name,
    Name,
    Rule,
    Rule,
    PrattRule,
    PrattRule
}

enum RuleField {
    Name,
    Annotation,
    VersionAnnotation,
    VersionAnnotation,
    Body
}

enum PrattRuleField {
    Name,
    VersionAnnotation,
    VersionAnnotation,
    Operator,
    Operator,
    Primary
}

enum PrattOperatorField {
    Type,
    Name,
    VersionAnnotation,
    VersionAnnotation,
    Body
}

enum PrattPrimaryField {
    Name,
    Body
}

enum VersionAnnotationField {
    Type,
    Version
}

enum ChoiceRuleField {
    Choice,
    Choice
}

enum SequenceRuleField {
    Element,
    Element
}

enum CountedRuleElementField {
    Label,
    CountableRuleElement,
    Count,
    VersionAnnotation,
    VersionAnnotation
}

enum RuleReferenceField {
    Name,
    Name
}

enum StringElementField {
    Value
}

enum CharSetField {
    Negated,
    StartChar,
    StartChar,
    EndChar,
    EndChar
}

enum AnyElementField {}

enum NegativeLookaheadField {
    Content
}

enum LineCommentField {
    Value
}

enum BlockCommentField {
    Value
}

enum WhitespaceField {
    Value
}

enum EnumRuleField {
    Member,
    Member
}

enum SeparatedByRuleField {
    Element,
    Separator,
    MinCount
}

export class Builder {
    mark(): Mark {}
    restore(mark: Mark) {}

    startDDD(): void {}

    finalise(): void {}

    setFFF(): void {}

    setDDDFFF(): void {}

    instructions: Instruction[] = [];
}

interface Mark {
    instructionsLength: number;
    typeStackLength: number;
}

type Instruction = SetInstruction | ExplicitSetInstruction | StartInstruction;
