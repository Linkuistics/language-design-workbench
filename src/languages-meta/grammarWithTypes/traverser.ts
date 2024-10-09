import {
    AnyElement,
    CharSet,
    ChoiceRule,
    CountableRuleElement,
    CountedRuleElement,
    EnumRule,
    Field,
    Grammar,
    NegativeLookahead,
    PrattOperator,
    PrattPrimary,
    PrattRule,
    Rule,
    RuleBody,
    RuleElement,
    RuleReference,
    SeparatedByRule,
    SequenceRule,
    StringElement,
    VersionAnnotation,
    VersionNumber
} from './model';

type VisitorResult<T> = T | void;

export interface TraverseDelegate {
    visitGrammar?(grammar: Grammar, traverser: Traverser): VisitorResult<Grammar>;
    visitRule?(rule: Rule, traverser: Traverser): VisitorResult<Rule>;
    visitRuleBody?(ruleBody: RuleBody, traverser: Traverser): VisitorResult<RuleBody>;
    visitPrattRule?(rule: PrattRule, traverser: Traverser): VisitorResult<PrattRule>;
    visitPrattOperator?(operator: PrattOperator, traverser: Traverser): VisitorResult<PrattOperator>;
    visitPrattPrimary?(primary: PrattPrimary, traverser: Traverser): VisitorResult<PrattPrimary>;
    visitChoiceRule?(rules: ChoiceRule, traverser: Traverser): VisitorResult<ChoiceRule>;
    visitSequenceRule?(sequenceRule: SequenceRule, traverser: Traverser): VisitorResult<SequenceRule>;
    visitEnumRule?(ruleBody: EnumRule, traverser: Traverser): VisitorResult<EnumRule>;
    visitSeparatedByRule?(ruleBody: SeparatedByRule, traverser: Traverser): VisitorResult<SeparatedByRule>;
    visitRuleElement?(ruleElement: RuleElement, traverser: Traverser): VisitorResult<RuleElement>;
    visitCountableRuleElement?(cre: CountableRuleElement, traverser: Traverser): VisitorResult<CountableRuleElement>;
    visitCountedRuleElement?(element: CountedRuleElement, traverser: Traverser): VisitorResult<CountedRuleElement>;
    visitNegativeLookahead?(ruleElement: NegativeLookahead, traverser: Traverser): VisitorResult<NegativeLookahead>;
    visitRuleReference?(ruleReference: RuleReference, traverser: Traverser): VisitorResult<RuleReference>;
    visitStringElement?(string: StringElement, traverser: Traverser): VisitorResult<StringElement>;
    visitCharSet?(charSet: CharSet, traverser: Traverser): VisitorResult<CharSet>;
    visitAnyElement?(anyElement: AnyElement, traverser: Traverser): VisitorResult<AnyElement>;
    visitVersionAnnotation?(
        versionAnnotation: VersionAnnotation,
        traverser: Traverser
    ): VisitorResult<VersionAnnotation>;
    visitVersionNumber?(versionNumber: VersionNumber, traverser: Traverser): VisitorResult<VersionNumber>;
    visitField?(field: Field, traverser: Traverser): VisitorResult<Field>;
}

export class Traverser {
    constructor(public delegate: TraverseDelegate) {}

    private visit<T>(node: T, visitorMethod: keyof TraverseDelegate, contentVisitor: () => void): T {
        const visitor = this.delegate[visitorMethod] as
            | ((node: T, traverser: Traverser) => VisitorResult<T>)
            | undefined;
        if (visitor) {
            return visitor.call(this.delegate, node, this) ?? node;
        }
        contentVisitor();
        return node;
    }

    visitGrammar(grammar: Grammar): Grammar {
        return this.visit(grammar, 'visitGrammar', () => this.visitGrammarContent(grammar));
    }

    visitGrammarContent(grammar: Grammar) {
        grammar.rules = grammar.rules.map((rule) => this.visitRule(rule));
        grammar.prattRules = grammar.prattRules.map((rule) => this.visitPrattRule(rule));
    }

    visitRule(rule: Rule): Rule {
        return this.visit(rule, 'visitRule', () => this.visitRuleContent(rule));
    }

    visitRuleContent(rule: Rule) {
        rule.body = this.visitRuleBody(rule.body);
        rule.versionAnnotations = rule.versionAnnotations.map((va) => this.visitVersionAnnotation(va));
    }

    visitRuleBody(ruleBody: RuleBody): RuleBody {
        return this.visit(ruleBody, 'visitRuleBody', () => {
            if (ruleBody instanceof SequenceRule) {
                return this.visitSequenceRule(ruleBody);
            } else if (ruleBody instanceof ChoiceRule) {
                return this.visitChoiceRule(ruleBody);
            } else if (ruleBody instanceof EnumRule) {
                return this.visitEnumRule(ruleBody);
            } else {
                return this.visitSeparatedByRule(ruleBody);
            }
        });
    }

    visitPrattRule(rule: PrattRule): PrattRule {
        return this.visit(rule, 'visitPrattRule', () => this.visitPrattRuleContent(rule));
    }

    visitPrattRuleContent(rule: PrattRule) {
        rule.operators = rule.operators.map((op) => this.visitPrattOperator(op));
        rule.primary = this.visitPrattPrimary(rule.primary);
        rule.versionAnnotations = rule.versionAnnotations.map((va) => this.visitVersionAnnotation(va));
    }

    visitPrattOperator(operator: PrattOperator): PrattOperator {
        return this.visit(operator, 'visitPrattOperator', () => this.visitPrattOperatorContent(operator));
    }

    visitPrattOperatorContent(operator: PrattOperator) {
        operator.body = this.visitRuleBody(operator.body);
        operator.versionAnnotations = operator.versionAnnotations.map((va) => this.visitVersionAnnotation(va));
    }

    visitPrattPrimary(primary: PrattPrimary): PrattPrimary {
        return this.visit(primary, 'visitPrattPrimary', () => this.visitPrattPrimaryContent(primary));
    }

    visitPrattPrimaryContent(primary: PrattPrimary) {
        primary.body = this.visitRuleBody(primary.body);
    }

    visitSequenceRule(sequenceRule: SequenceRule): SequenceRule {
        return this.visit(sequenceRule, 'visitSequenceRule', () => this.visitSequenceRuleContent(sequenceRule));
    }

    visitSequenceRuleContent(sequenceRule: SequenceRule) {
        sequenceRule.elements = sequenceRule.elements.map((el) => this.visitRuleElement(el));
    }

    visitEnumRule(rule: EnumRule): EnumRule {
        return this.visit(rule, 'visitEnumRule', () => this.visitEnumRuleContent(rule));
    }

    visitEnumRuleContent(rule: EnumRule) {
        if (rule.field) {
            rule.field = this.visitField(rule.field);
        }
    }

    visitSeparatedByRule(rule: SeparatedByRule): SeparatedByRule {
        return this.visit(rule, 'visitSeparatedByRule', () => this.visitSeparatedByRuleContent(rule));
    }

    visitSeparatedByRuleContent(rule: SeparatedByRule) {
        rule.element = this.visitRuleElement(rule.element);
    }

    visitRuleElement(ruleElement: RuleElement): RuleElement {
        return this.visit(ruleElement, 'visitRuleElement', () => {
            if (ruleElement instanceof CountedRuleElement) {
                return this.visitCountedRuleElement(ruleElement);
            } else {
                return this.visitNegativeLookahead(ruleElement);
            }
        });
    }

    visitCharSet(charSet: CharSet): CharSet {
        return this.visit(charSet, 'visitCharSet', () => this.visitCharSetContent(charSet));
    }

    visitCharSetContent(charSet: CharSet) {
        if (charSet.field) {
            charSet.field = this.visitField(charSet.field);
        }
    }

    visitNegativeLookahead(negativeLookahead: NegativeLookahead): NegativeLookahead {
        return this.visit(negativeLookahead, 'visitNegativeLookahead', () =>
            this.visitNegativeLookaheadContent(negativeLookahead)
        );
    }

    visitNegativeLookaheadContent(negativeLookahead: NegativeLookahead) {
        negativeLookahead.content =
            negativeLookahead.content instanceof CharSet
                ? this.visitCharSet(negativeLookahead.content)
                : this.visitStringElement(negativeLookahead.content);
    }

    visitChoiceRule(rules: ChoiceRule): ChoiceRule {
        return this.visit(rules, 'visitChoiceRule', () => this.visitChoiceRuleContent(rules));
    }

    visitChoiceRuleContent(rules: ChoiceRule) {
        rules.choices = rules.choices.map((choice) => this.visitSequenceRule(choice));
    }

    visitCountedRuleElement(element: CountedRuleElement): CountedRuleElement {
        return this.visit(element, 'visitCountedRuleElement', () => this.visitCountedRuleElementContent(element));
    }

    visitCountedRuleElementContent(element: CountedRuleElement) {
        element.countableRuleElement = this.visitCountableRuleElement(element.countableRuleElement);
        element.versionAnnotations = element.versionAnnotations.map((va) => this.visitVersionAnnotation(va));
    }

    visitCountableRuleElement(cre: CountableRuleElement): CountableRuleElement {
        return this.visit(cre, 'visitCountableRuleElement', () => {
            if (cre instanceof RuleReference) {
                return this.visitRuleReference(cre);
            } else if (cre instanceof AnyElement) {
                return this.visitAnyElement(cre);
            } else if (cre instanceof StringElement) {
                return this.visitStringElement(cre);
            } else if (cre instanceof CharSet) {
                return this.visitCharSet(cre);
            } else {
                return this.visitRuleBody(cre);
            }
        });
    }

    visitRuleReference(ruleReference: RuleReference): RuleReference {
        return this.visit(ruleReference, 'visitRuleReference', () => this.visitRuleReferenceContent(ruleReference));
    }

    visitRuleReferenceContent(ruleReference: RuleReference) {
        if (ruleReference.field) {
            ruleReference.field = this.visitField(ruleReference.field);
        }
    }

    visitStringElement(stringElement: StringElement): StringElement {
        return this.visit(stringElement, 'visitStringElement', () => this.visitStringElementContent(stringElement));
    }

    visitStringElementContent(stringElement: StringElement) {
        if (stringElement.field) {
            stringElement.field = this.visitField(stringElement.field);
        }
    }

    visitAnyElement(anyElement: AnyElement): AnyElement {
        return this.visit(anyElement, 'visitAnyElement', () => this.visitAnyElementContent(anyElement));
    }

    visitAnyElementContent(anyElement: AnyElement) {
        if (anyElement.field) {
            anyElement.field = this.visitField(anyElement.field);
        }
    }

    visitVersionAnnotation(versionAnnotation: VersionAnnotation): VersionAnnotation {
        return this.visit(versionAnnotation, 'visitVersionAnnotation', () =>
            this.visitVersionAnnotationContent(versionAnnotation)
        );
    }

    visitVersionAnnotationContent(versionAnnotation: VersionAnnotation) {
        versionAnnotation.version = this.visitVersionNumber(versionAnnotation.version);
    }

    visitVersionNumber(versionNumber: VersionNumber): VersionNumber {
        return this.visit(versionNumber, 'visitVersionNumber', () => {});
    }

    visitField(field: Field): Field {
        return this.visit(field, 'visitField', () => {});
    }
}
