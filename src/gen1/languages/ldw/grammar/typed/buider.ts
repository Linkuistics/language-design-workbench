// Generated on 2024-10-19T22:19:37.929Z
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
    SeparatedByRule,
    Field
}

enum GrammarField {
    Name,
    Name,
    Rule,
    Rule,
    PrattRule,
    PrattRule,
    Definition,
    Definition
}

enum RuleField {
    Name,
    Annotation,
    VersionAnnotation,
    VersionAnnotation,
    Body,
    Type
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
    CountableRuleElement,
    Count,
    VersionAnnotation,
    VersionAnnotation
}

enum RuleReferenceField {
    Name,
    Name,
    Field
}

enum StringElementField {
    Value,
    Field
}

enum CharSetField {
    Negated,
    StartChar,
    StartChar,
    EndChar,
    EndChar,
    Field
}

enum AnyElementField {
    Field
}

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
    Member,
    Field
}

enum SeparatedByRuleField {
    Element,
    Separator,
    MinCount
}

enum FieldField {
    Type,
    Name,
    IsExplicit
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
