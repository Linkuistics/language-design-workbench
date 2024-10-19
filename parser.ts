import * as Model from './src/gen0/languages/ldw/grammar/parsed/model';
import * as HappyPathParser from './src/gen0/parsing/happyPathParser';
import * as Builder from './src/gen0/parsing/builder';
import assert from 'assert';

export class Parser extends HappyPathParser.ParserBase {
    parseGrammar(label: string | undefined): boolean {
        return this.skipTrivia(() => this.#_parseGrammar(label));
    }

    parseName(label: string | undefined): boolean {
        return this.skipTrivia(() => this.#_parseName(label));
    }

    parseRule(label: string | undefined): boolean {
        return this.skipTrivia(() => this.#_parseRule(label));
    }

    parsePrattRule(label: string | undefined): boolean {
        return this.skipTrivia(() => this.#_parsePrattRule(label));
    }

    parseIdentifier(label: string | undefined): boolean {
        return this.skipTrivia(() => this.#_parseIdentifier(label));
    }

    parseRuleAnnotation(label: string | undefined): boolean {
        return this.skipTrivia(() => this.#_parseRuleAnnotation(label));
    }

    parseVersionAnnotation(label: string | undefined): boolean {
        return this.skipTrivia(() => this.#_parseVersionAnnotation(label));
    }

    parseRuleBody(label: string | undefined): boolean {
        return this.skipTrivia(() => this.#_parseRuleBody(label));
    }

    parsePrattOperator(label: string | undefined): boolean {
        return this.skipTrivia(() => this.#_parsePrattOperator(label));
    }

    parsePrattPrimary(label: string | undefined): boolean {
        return this.skipTrivia(() => this.#_parsePrattPrimary(label));
    }

    parseVersionAnnotationType(label: string | undefined): boolean {
        return this.skipTrivia(() => this.#_parseVersionAnnotationType(label));
    }

    parseVersionNumber(label: string | undefined): boolean {
        return this.skipTrivia(() => this.#_parseVersionNumber(label));
    }

    parseChoiceRule(label: string | undefined): boolean {
        return this.skipTrivia(() => this.#_parseChoiceRule(label));
    }

    parseSequenceRule(label: string | undefined): boolean {
        return this.skipTrivia(() => this.#_parseSequenceRule(label));
    }

    parsePrattOperatorType(label: string | undefined): boolean {
        return this.skipTrivia(() => this.#_parsePrattOperatorType(label));
    }

    parseVersionSegment(label: string | undefined): boolean {
        return this.skipTrivia(() => this.#_parseVersionSegment(label));
    }

    parseRuleElement(label: string | undefined): boolean {
        return this.skipTrivia(() => this.#_parseRuleElement(label));
    }

    parseCountedRuleElement(label: string | undefined): boolean {
        return this.skipTrivia(() => this.#_parseCountedRuleElement(label));
    }

    parseNegativeLookahead(label: string | undefined): boolean {
        return this.skipTrivia(() => this.#_parseNegativeLookahead(label));
    }

    parseLabel(label: string | undefined): boolean {
        return this.skipTrivia(() => this.#_parseLabel(label));
    }

    parseCountableRuleElement(label: string | undefined): boolean {
        return this.skipTrivia(() => this.#_parseCountableRuleElement(label));
    }

    parseCount(label: string | undefined): boolean {
        return this.skipTrivia(() => this.#_parseCount(label));
    }

    parseCharSet(label: string | undefined): boolean {
        return this.skipTrivia(() => this.#_parseCharSet(label));
    }

    parseStringElement(label: string | undefined): boolean {
        return this.skipTrivia(() => this.#_parseStringElement(label));
    }

    parseRuleReference(label: string | undefined): boolean {
        return this.skipTrivia(() => this.#_parseRuleReference(label));
    }

    parseAnyElement(label: string | undefined): boolean {
        return this.skipTrivia(() => this.#_parseAnyElement(label));
    }

    parseCharSetChar(label: string | undefined): boolean {
        return this.skipTrivia(() => this.#_parseCharSetChar(label));
    }

    #_parseGrammar(label: string | undefined): boolean {
        return this.buildObject(label, Build.grammar, () =>
            this.skipSeq(
                () =>
                    this.skipTrivia(() => this.skipString('grammar')) &&
                    this.#_parseName(GrammarField.Name) &&
                    this.skipZeroOrMore(() =>
                        this.skipSeq(
                            () => this.skipTrivia(() => this.skipString('::')) && this.#_parseName(GrammarField.Name)
                        )
                    ) &&
                    this.skipTrivia(() => this.skipString('{')) &&
                    this.skipZeroOrMore(
                        () => this.#_parseRule(GrammarField.Rule) || this.#_parsePrattRule(GrammarField.PrattRule)
                    ) &&
                    this.skipTrivia(() => this.skipString('}'))
            )
        );
    }

    #_parseName(label: string | undefined): boolean {
        return this.#_parseIdentifier(label);
    }

    #_parseRule(label: string | undefined): boolean {
        return this.buildObject(label, Build.rule, () =>
            this.skipSeq(
                () =>
                    this.#_parseName(RuleField.Name) &&
                    this.skipOptional(() => this.#_parseRuleAnnotation(RuleField.Annotation)) &&
                    this.skipZeroOrMore(() => this.#_parseVersionAnnotation(RuleField.VersionAnnotation)) &&
                    this.skipTrivia(() => this.skipString('=')) &&
                    this.#_parseRuleBody(RuleField.Body) &&
                    this.skipTrivia(() => this.skipString(';'))
            )
        );
    }

    #_parsePrattRule(label: string | undefined): boolean {
        return this.buildObject(label, Build.prattRule, () =>
            this.skipSeq(
                () =>
                    this.skipTrivia(() => this.skipString('pratt')) &&
                    this.#_parseName(PrattRuleField.Name) &&
                    this.skipZeroOrMore(() => this.#_parseVersionAnnotation(PrattRuleField.VersionAnnotation)) &&
                    this.skipTrivia(() => this.skipString('{')) &&
                    this.skipOneOrMore(() => this.#_parsePrattOperator(PrattRuleField.Operator)) &&
                    this.#_parsePrattPrimary(PrattRuleField.Primary) &&
                    this.skipTrivia(() => this.skipString('}'))
            )
        );
    }

    #_parseRuleAnnotation(label: string | undefined): boolean {
        return this.buildEnum(label, ['no_skip', Model.RuleAnnotation.NoSkip], ['atomic', Model.RuleAnnotation.Atomic]);
    }

    #_parseVersionAnnotation(label: string | undefined): boolean {
        return this.ignoreSkipTriviaDuring(() =>
            this.buildObject(label, Build.versionAnnotation, () =>
                this.skipSeq(
                    () =>
                        this.#_parseVersionAnnotationType(VersionAnnotationField.Type) &&
                        this.skipString('(') &&
                        this.#_parseVersionNumber(VersionAnnotationField.Version) &&
                        this.skipString(')')
                )
            )
        );
    }

    #_parseRuleBody(label: string | undefined): boolean {
        return this.#_parseChoiceRule(label) || this.#_parseSequenceRule(label);
    }

    #_parsePrattOperator(label: string | undefined): boolean {
        return this.buildObject(label, Build.prattOperator, () =>
            this.skipSeq(
                () =>
                    this.#_parsePrattOperatorType(PrattOperatorField.Type) &&
                    this.#_parseName(PrattOperatorField.Name) &&
                    this.skipZeroOrMore(() => this.#_parseVersionAnnotation(PrattOperatorField.VersionAnnotation)) &&
                    this.skipTrivia(() => this.skipString('=')) &&
                    this.#_parseRuleBody(PrattOperatorField.Body) &&
                    this.skipTrivia(() => this.skipString(';'))
            )
        );
    }

    #_parsePrattPrimary(label: string | undefined): boolean {
        return this.buildObject(label, Build.prattPrimary, () =>
            this.skipSeq(
                () =>
                    this.skipTrivia(() => this.skipString('primary')) &&
                    this.#_parseName(PrattPrimaryField.Name) &&
                    this.skipTrivia(() => this.skipString('=')) &&
                    this.#_parseRuleBody(PrattPrimaryField.Body) &&
                    this.skipTrivia(() => this.skipString(';'))
            )
        );
    }

    #_parseVersionAnnotationType(label: string | undefined): boolean {
        return this.buildEnum(
            label,
            ['enabled', Model.VersionAnnotationType.Enabled],
            ['disabled', Model.VersionAnnotationType.Disabled]
        );
    }

    #_parseVersionNumber(label: string | undefined): boolean {
        return this.buildObject(label, Build.versionNumber, () =>
            this.skipSeq(
                () =>
                    this.#_parseVersionSegment(undefined) &&
                    this.skipZeroOrMore(() =>
                        this.skipSeq(
                            () => this.skipTrivia(() => this.skipString('.')) && this.#_parseVersionSegment(undefined)
                        )
                    )
            )
        );
    }

    #_parseChoiceRule(label: string | undefined): boolean {
        return this.buildObject(label, Build.choiceRule, () =>
            this.skipSeq(
                () =>
                    this.#_parseSequenceRule(ChoiceRuleField.Choice) &&
                    this.skipOneOrMore(() =>
                        this.skipSeq(
                            () =>
                                this.skipTrivia(() => this.skipString('|')) &&
                                this.#_parseSequenceRule(ChoiceRuleField.Choice)
                        )
                    )
            )
        );
    }

    #_parseSequenceRule(label: string | undefined): boolean {
        return this.buildObject(label, Build.sequenceRule, () =>
            this.skipOneOrMore(() => this.#_parseRuleElement(SequenceRuleField.Element))
        );
    }

    #_parsePrattOperatorType(label: string | undefined): boolean {
        return this.buildEnum(
            label,
            ['prefix', Model.PrattOperatorType.Prefix],
            ['postfix', Model.PrattOperatorType.Postfix],
            ['left', Model.PrattOperatorType.Left],
            ['right', Model.PrattOperatorType.Right]
        );
    }

    #_parseRuleElement(label: string | undefined): boolean {
        return this.#_parseCountedRuleElement(label) || this.#_parseNegativeLookahead(label);
    }

    #_parseCountedRuleElement(label: string | undefined): boolean {
        return this.buildObject(label, Build.countedRuleElement, () =>
            this.skipSeq(
                () =>
                    this.skipOptional(() => this.#_parseLabel(CountedRuleElementField.Label)) &&
                    this.#_parseCountableRuleElement(CountedRuleElementField.CountableRuleElement) &&
                    this.skipOptional(() => this.#_parseCount(CountedRuleElementField.Count)) &&
                    this.skipZeroOrMore(() => this.#_parseVersionAnnotation(CountedRuleElementField.VersionAnnotation))
            )
        );
    }

    #_parseNegativeLookahead(label: string | undefined): boolean {
        return this.ignoreSkipTriviaDuring(() =>
            this.buildObject(label, Build.negativeLookahead, () =>
                this.skipSeq(
                    () =>
                        this.skipString('!') &&
                        (this.#_parseCharSet(NegativeLookaheadField.Content) ||
                            this.#_parseStringElement(NegativeLookaheadField.Content))
                )
            )
        );
    }

    #_parseLabel(label: string | undefined): boolean {
        return this.ignoreSkipTriviaDuring(() => this.skipSeq(() => this.#_parseName(label) && this.skipString(':')));
    }

    #_parseCountableRuleElement(label: string | undefined): boolean {
        return (
            this.#_parseRuleReference(label) ||
            this.#_parseStringElement(label) ||
            this.#_parseCharSet(label) ||
            this.#_parseAnyElement(label) ||
            this.skipSeq(
                () =>
                    this.skipTrivia(() => this.skipString('(')) &&
                    this.#_parseRuleBody(label) &&
                    this.skipTrivia(() => this.skipString(')'))
            )
        );
    }

    #_parseCount(label: string | undefined): boolean {
        return this.buildEnum(
            label,
            ['one_or_more', Model.Count.OneOrMore],
            ['zero_or_more', Model.Count.ZeroOrMore],
            ['optional', Model.Count.Optional]
        );
    }

    #_parseCharSet(label: string | undefined): boolean {
        return this.ignoreSkipTriviaDuring(() =>
            this.buildObject(label, Build.charSet, () =>
                this.skipSeq(
                    () =>
                        this.skipString('[') &&
                        this.skipOptional(() => this.buildBoolean('negated', () => this.skipString('^'))) &&
                        this.skipOneOrMore(() =>
                            this.skipSeq(
                                () =>
                                    this.#_parseCharSetChar(CharSetField.StartChar) &&
                                    this.skipOptional(() =>
                                        this.skipSeq(
                                            () => this.skipString('-') && this.#_parseCharSetChar(CharSetField.EndChar)
                                        )
                                    )
                            )
                        ) &&
                        this.skipString(']')
                )
            )
        );
    }

    #_parseRuleReference(label: string | undefined): boolean {
        return this.ignoreSkipTriviaDuring(() =>
            this.buildObject(label, Build.ruleReference, () =>
                this.skipSeq(
                    () =>
                        this.#_parseName(RuleReferenceField.Name) &&
                        this.skipZeroOrMore(() =>
                            this.skipSeq(() => this.skipString('::') && this.#_parseName(RuleReferenceField.Name))
                        )
                )
            )
        );
    }

    #_parseAnyElement(label: string | undefined): boolean {
        return this.buildObject(label, Build.anyElement, () => this.skipTrivia(() => this.skipString('.')));
    }

    #_parseIdentifier(label: string | undefined): boolean {
        return this.buildString(label, () => this.#_lexIdentifier());
    }

    #_lexIdentifier(): boolean {
        return this.skipSeq(
            () => this.skipRegex(/[a-zA-Z_]/) && this.skipZeroOrMore(() => this.skipRegex(/[a-zA-Z0-9_]/))
        );
    }

    #_parseVersionSegment(label: string | undefined): boolean {
        return this.buildString(label, () => this.#_lexVersionSegment());
    }

    #_lexVersionSegment(): boolean {
        return this.skipOneOrMore(() => this.skipRegex(/[0-9]/));
    }

    #_parseStringElement(label: string | undefined): boolean {
        return this.buildStringObject(label, Model.StringElement, () => this.#_lexStringElement());
    }

    #_lexStringElement(): boolean {
        return (
            this.skipSeq(
                () =>
                    this.skipString("'") &&
                    this.skipZeroOrMore(
                        () =>
                            this.skipZeroOrMore(() => this.skipRegex(/[^'\\\n]/)) ||
                            this.skipSeq(() => this.skipString('\\\\') && this.skipRegex(/['\\]/))
                    ) &&
                    this.skipString("'")
            ) ||
            this.skipSeq(
                () =>
                    this.skipString('"') &&
                    this.skipZeroOrMore(
                        () =>
                            this.skipZeroOrMore(() => this.skipRegex(/[^"\\\n]/)) ||
                            this.skipSeq(() => this.skipString('\\\\') && this.skipRegex(/["\\]/))
                    ) &&
                    this.skipString('"')
            )
        );
    }

    #_parseCharSetChar(label: string | undefined): boolean {
        return this.buildString(label, () => this.#_lexCharSetChar());
    }

    #_lexCharSetChar(): boolean {
        return (
            this.skipRegex(/[^\\\-\]]/) || this.skipSeq(() => this.skipString('\\\\') && this.skipRegex(/[\^\\\-\]nt]/))
        );
    }

    consumeIdentifierForKeyword(): string | undefined {
        const start = this.getPosition();
        if (this.#_lexIdentifier()) return this.makeString(start, this.input.getPosition());
        return undefined;
    }

    consumeTrivia(): string | undefined {
        if (this.#_lexLineComment()) return 'LineComment';
        if (this.#_lexBlockComment()) return 'BlockComment';
        if (this.#_lexWhitespace()) return 'Whitespace';
        return undefined;
    }

    #_lexLineComment(): boolean {
        return this.skipSeq(
            () =>
                this.skipString('//') &&
                this.skipZeroOrMore(() => this.skipRegex(/[^\n]/)) &&
                this.skipOptional(() => this.skipString('\\n'))
        );
    }

    #_lexBlockComment(): boolean {
        return this.skipSeq(
            () =>
                this.skipString('/*') &&
                this.skipZeroOrMore(
                    () =>
                        this.skipOneOrMore(() => this.skipRegex(/[^*]/)) ||
                        this.skipSeq(
                            () => this.skipString('*') && this.skipNegativeLookahead(() => this.skipString('/'))
                        )
                ) &&
                this.skipString('/')
        );
    }

    #_lexWhitespace(): boolean {
        return this.skipOneOrMore(() => this.skipRegex(/[\n\t ]/));
    }
}

enum GrammarField {
    Name = 'Grammar.name',
    Names = 'Grammar.names',
    Rule = 'Grammar.rule',
    Rules = 'Grammar.rules',
    PrattRule = 'Grammar.prattRule',
    PrattRules = 'Grammar.prattRules'
}

enum RuleField {
    Name = 'Rule.name',
    Annotation = 'Rule.annotation',
    VersionAnnotation = 'Rule.versionAnnotation',
    VersionAnnotations = 'Rule.versionAnnotations',
    Body = 'Rule.body'
}

enum PrattRuleField {
    Name = 'PrattRule.name',
    VersionAnnotation = 'PrattRule.versionAnnotation',
    VersionAnnotations = 'PrattRule.versionAnnotations',
    Operator = 'PrattRule.operator',
    Operators = 'PrattRule.operators',
    Primary = 'PrattRule.primary'
}

enum VersionAnnotationField {
    Type = 'VersionAnnotation.type',
    Version = 'VersionAnnotation.version'
}

enum PrattOperatorField {
    Type = 'PrattOperator.type',
    Name = 'PrattOperator.name',
    VersionAnnotation = 'PrattOperator.versionAnnotation',
    VersionAnnotations = 'PrattOperator.versionAnnotations',
    Body = 'PrattOperator.body'
}

enum PrattPrimaryField {
    Name = 'PrattPrimary.name',
    Body = 'PrattPrimary.body'
}

enum ChoiceRuleField {
    Choice = 'ChoiceRule.choice',
    Choices = 'ChoiceRule.choices'
}

enum SequenceRuleField {
    Element = 'SequenceRule.element',
    Elements = 'SequenceRule.elements'
}

enum CountedRuleElementField {
    Label = 'CountedRuleElement.label',
    CountableRuleElement = 'CountedRuleElement.countableRuleElement',
    Count = 'CountedRuleElement.count',
    VersionAnnotation = 'CountedRuleElement.versionAnnotation',
    VersionAnnotations = 'CountedRuleElement.versionAnnotations'
}

enum NegativeLookaheadField {
    Content = 'NegativeLookahead.content'
}

enum CharSetField {
    Negated = 'CharSet.negated',
    StartChar = 'CharSet.startChar',
    StartChars = 'CharSet.startChars',
    EndChar = 'CharSet.endChar',
    EndChars = 'CharSet.endChars'
}

enum RuleReferenceField {
    Name = 'RuleReference.name',
    Names = 'RuleReference.names'
}

enum AnyElementField {}

class Build {
    static grammar(stack: Builder.Stack): Model.Grammar {
        let names: Model.Name[] = [];
        let rules: Model.Rule[] = [];
        let prattRules: Model.PrattRule[] = [];
        for (const x of stack) {
            switch (x.label) {
                case GrammarField.Names:
                    names = x.value as Model.Name[];
                    break;
                case GrammarField.Name:
                    names.push(x.value as Model.Name);
                    break;
                case GrammarField.Rules:
                    rules = x.value as Model.Rule[];
                    break;
                case GrammarField.Rule:
                    rules.push(x.value as Model.Rule);
                    break;
                case GrammarField.PrattRules:
                    prattRules = x.value as Model.PrattRule[];
                    break;
                case GrammarField.PrattRule:
                    prattRules.push(x.value as Model.PrattRule);
                    break;
                default:
                    break;
            }
        }
        return new Model.Grammar({
            names: names,
            rules: rules,
            prattRules: prattRules
        });
    }

    static rule(stack: Builder.Stack): Model.Rule {
        let name: Model.Name | undefined = undefined;
        let annotation: Model.RuleAnnotation | undefined = undefined;
        let versionAnnotations: Model.VersionAnnotation[] = [];
        let body: Model.RuleBody | undefined = undefined;
        for (const x of stack) {
            switch (x.label) {
                case RuleField.Name:
                    name = x.value as Model.Name;
                    break;
                case RuleField.Annotation:
                    annotation = x.value as Model.RuleAnnotation | undefined;
                    break;
                case RuleField.VersionAnnotations:
                    versionAnnotations = x.value as Model.VersionAnnotation[];
                    break;
                case RuleField.VersionAnnotation:
                    versionAnnotations.push(x.value as Model.VersionAnnotation);
                    break;
                case RuleField.Body:
                    body = x.value as Model.RuleBody;
                    break;
                default:
                    break;
            }
        }
        assert(name !== undefined);
        assert(body !== undefined);
        return new Model.Rule({
            name: name,
            annotation: annotation,
            versionAnnotations: versionAnnotations,
            body: body
        });
    }

    static prattRule(stack: Builder.Stack): Model.PrattRule {
        let name: Model.Name | undefined = undefined;
        let versionAnnotations: Model.VersionAnnotation[] = [];
        let operators: Model.PrattOperator[] = [];
        let primary: Model.PrattPrimary | undefined = undefined;
        for (const x of stack) {
            switch (x.label) {
                case PrattRuleField.Name:
                    name = x.value as Model.Name;
                    break;
                case PrattRuleField.VersionAnnotations:
                    versionAnnotations = x.value as Model.VersionAnnotation[];
                    break;
                case PrattRuleField.VersionAnnotation:
                    versionAnnotations.push(x.value as Model.VersionAnnotation);
                    break;
                case PrattRuleField.Operators:
                    operators = x.value as Model.PrattOperator[];
                    break;
                case PrattRuleField.Operator:
                    operators.push(x.value as Model.PrattOperator);
                    break;
                case PrattRuleField.Primary:
                    primary = x.value as Model.PrattPrimary;
                    break;
                default:
                    break;
            }
        }
        assert(name !== undefined);
        assert(primary !== undefined);
        return new Model.PrattRule({
            name: name,
            versionAnnotations: versionAnnotations,
            operators: operators,
            primary: primary
        });
    }

    static versionAnnotation(stack: Builder.Stack): Model.VersionAnnotation {
        let type: Model.VersionAnnotationType | undefined = undefined;
        let version: Model.VersionNumber | undefined = undefined;
        for (const x of stack) {
            switch (x.label) {
                case VersionAnnotationField.Type:
                    type = x.value as Model.VersionAnnotationType;
                    break;
                case VersionAnnotationField.Version:
                    version = x.value as Model.VersionNumber;
                    break;
                default:
                    break;
            }
        }
        assert(type !== undefined);
        assert(version !== undefined);
        return new Model.VersionAnnotation({
            type: type,
            version: version
        });
    }

    static prattOperator(stack: Builder.Stack): Model.PrattOperator {
        let type: Model.PrattOperatorType | undefined = undefined;
        let name: Model.Name | undefined = undefined;
        let versionAnnotations: Model.VersionAnnotation[] = [];
        let body: Model.RuleBody | undefined = undefined;
        for (const x of stack) {
            switch (x.label) {
                case PrattOperatorField.Type:
                    type = x.value as Model.PrattOperatorType;
                    break;
                case PrattOperatorField.Name:
                    name = x.value as Model.Name;
                    break;
                case PrattOperatorField.VersionAnnotations:
                    versionAnnotations = x.value as Model.VersionAnnotation[];
                    break;
                case PrattOperatorField.VersionAnnotation:
                    versionAnnotations.push(x.value as Model.VersionAnnotation);
                    break;
                case PrattOperatorField.Body:
                    body = x.value as Model.RuleBody;
                    break;
                default:
                    break;
            }
        }
        assert(type !== undefined);
        assert(name !== undefined);
        assert(body !== undefined);
        return new Model.PrattOperator({
            type: type,
            name: name,
            versionAnnotations: versionAnnotations,
            body: body
        });
    }

    static prattPrimary(stack: Builder.Stack): Model.PrattPrimary {
        let name: Model.Name | undefined = undefined;
        let body: Model.RuleBody | undefined = undefined;
        for (const x of stack) {
            switch (x.label) {
                case PrattPrimaryField.Name:
                    name = x.value as Model.Name;
                    break;
                case PrattPrimaryField.Body:
                    body = x.value as Model.RuleBody;
                    break;
                default:
                    break;
            }
        }
        assert(name !== undefined);
        assert(body !== undefined);
        return new Model.PrattPrimary({
            name: name,
            body: body
        });
    }

    static versionNumber(stack: Builder.Stack): Model.VersionNumber {
        return stack.map((x) => x.value);
    }

    static choiceRule(stack: Builder.Stack): Model.ChoiceRule {
        let choices: Model.SequenceRule[] = [];
        for (const x of stack) {
            switch (x.label) {
                case ChoiceRuleField.Choices:
                    choices = x.value as Model.SequenceRule[];
                    break;
                case ChoiceRuleField.Choice:
                    choices.push(x.value as Model.SequenceRule);
                    break;
                default:
                    break;
            }
        }
        return new Model.ChoiceRule({
            choices: choices
        });
    }

    static sequenceRule(stack: Builder.Stack): Model.SequenceRule {
        let elements: Model.RuleElement[] = [];
        for (const x of stack) {
            switch (x.label) {
                case SequenceRuleField.Elements:
                    elements = x.value as Model.RuleElement[];
                    break;
                case SequenceRuleField.Element:
                    elements.push(x.value as Model.RuleElement);
                    break;
                default:
                    break;
            }
        }
        return new Model.SequenceRule({
            elements: elements
        });
    }

    static countedRuleElement(stack: Builder.Stack): Model.CountedRuleElement {
        let label: Model.Label | undefined = undefined;
        let countableRuleElement: Model.CountableRuleElement | undefined = undefined;
        let count: Model.Count | undefined = undefined;
        let versionAnnotations: Model.VersionAnnotation[] = [];
        for (const x of stack) {
            switch (x.label) {
                case CountedRuleElementField.Label:
                    label = x.value as Model.Label | undefined;
                    break;
                case CountedRuleElementField.CountableRuleElement:
                    countableRuleElement = x.value as Model.CountableRuleElement;
                    break;
                case CountedRuleElementField.Count:
                    count = x.value as Model.Count | undefined;
                    break;
                case CountedRuleElementField.VersionAnnotations:
                    versionAnnotations = x.value as Model.VersionAnnotation[];
                    break;
                case CountedRuleElementField.VersionAnnotation:
                    versionAnnotations.push(x.value as Model.VersionAnnotation);
                    break;
                default:
                    break;
            }
        }
        assert(countableRuleElement !== undefined);
        return new Model.CountedRuleElement({
            label: label,
            countableRuleElement: countableRuleElement,
            count: count,
            versionAnnotations: versionAnnotations
        });
    }

    static negativeLookahead(stack: Builder.Stack): Model.NegativeLookahead {
        let content: Model.CharSet | Model.StringElement | undefined = undefined;
        for (const x of stack) {
            switch (x.label) {
                case NegativeLookaheadField.Content:
                    content = x.value as Model.CharSet | Model.StringElement;
                    break;
                default:
                    break;
            }
        }
        assert(content !== undefined);
        return new Model.NegativeLookahead({
            content: content
        });
    }

    static charSet(stack: Builder.Stack): Model.CharSet {
        let negated: boolean | undefined = undefined;
        let startChars: Model.CharSetChar[] = [];
        let endChars: (Model.CharSetChar | undefined)[] = [];
        for (const x of stack) {
            switch (x.label) {
                case CharSetField.Negated:
                    negated = x.value as boolean;
                    break;
                case CharSetField.StartChars:
                    startChars = x.value as Model.CharSetChar[];
                    break;
                case CharSetField.StartChar:
                    startChars.push(x.value as Model.CharSetChar);
                    break;
                case CharSetField.EndChars:
                    endChars = x.value as (Model.CharSetChar | undefined)[];
                    break;
                case CharSetField.EndChar:
                    endChars.push(x.value as Model.CharSetChar | undefined);
                    break;
                default:
                    break;
            }
        }
        assert(negated !== undefined);
        return new Model.CharSet({
            negated: negated,
            startChars: startChars,
            endChars: endChars
        });
    }

    static ruleReference(stack: Builder.Stack): Model.RuleReference {
        let names: Model.Name[] = [];
        for (const x of stack) {
            switch (x.label) {
                case RuleReferenceField.Names:
                    names = x.value as Model.Name[];
                    break;
                case RuleReferenceField.Name:
                    names.push(x.value as Model.Name);
                    break;
                default:
                    break;
            }
        }
        return new Model.RuleReference({
            names: names
        });
    }

    static anyElement(stack: Builder.Stack): Model.AnyElement {
        return new Model.AnyElement();
    }
}
