import {
    ChoiceRule,
    AnyElement,
    CharSet,
    CharSetChar,
    CountableRuleElement,
    CountedRuleElement,
    Grammar,
    NegativeLookahead,
    PrattOperator,
    PrattPrimary,
    PrattRule,
    Rule,
    RuleBody,
    RuleElement,
    RuleReference,
    SequenceRule,
    StringElement,
    VersionAnnotation,
    VersionNumber,
    EnumRule,
    SeparatedByRule
} from './model';

export interface TraverseDelegate {
    visitGrammar?(grammar: Grammar, traverser: Traverser): Grammar | void;

    visitRule?(rule: Rule, traverser: Traverser): Rule | void;

    visitRuleBody?(ruleBody: RuleBody, traverser: Traverser): RuleBody | void;

    visitPrattRule?(rule: PrattRule, traverser: Traverser): PrattRule | void;

    visitPrattOperator?(operator: PrattOperator, traverser: Traverser): PrattOperator | void;

    visitPrattPrimary?(primary: PrattPrimary, traverser: Traverser): PrattPrimary | void;

    visitChoiceRule?(rules: ChoiceRule, traverser: Traverser): ChoiceRule | void;

    visitSequenceRule?(sequenceRule: SequenceRule, traverser: Traverser): SequenceRule | void;

    visitEnumRule?(ruleBody: EnumRule, traverser: Traverser): EnumRule | void;

    visitSeparatedByRule?(ruleBody: SeparatedByRule, traverser: Traverser): SeparatedByRule | void;

    visitRuleElement?(ruleElement: RuleElement, traverser: Traverser): RuleElement | void;

    visitCountableRuleElement?(cre: CountableRuleElement, traverser: Traverser): CountableRuleElement | void;

    visitCountedRuleElement?(element: CountedRuleElement, traverser: Traverser): CountedRuleElement | void;

    visitNegativeLookahead?(ruleElement: NegativeLookahead, traverser: Traverser): NegativeLookahead | void;

    visitRuleReference?(ruleReference: RuleReference, traverser: Traverser): RuleReference | void;

    visitStringElement?(string: StringElement, traverser: Traverser): StringElement | void;

    visitCharSet?(charSet: CharSet, traverser: Traverser): CharSet | void;

    visitAnyElement?(anyElement: AnyElement, traverser: Traverser): AnyElement | void;

    visitCharSetRange?(
        range: { startChar: CharSetChar; endChar?: CharSetChar },
        traverser: Traverser
    ): { startChar: CharSetChar; endChar?: CharSetChar } | void;

    visitVersionAnnotation?(versionAnnotation: VersionAnnotation, traverser: Traverser): VersionAnnotation | void;

    visitVersionNumber?(versionNumber: VersionNumber, traverser: Traverser): VersionNumber | void;
}

export class Traverser {
    constructor(public delegate: TraverseDelegate) {}

    visitGrammar(grammar: Grammar): Grammar {
        if (this.delegate.visitGrammar) return this.delegate.visitGrammar(grammar, this) ?? grammar;
        this.visitGrammarContent(grammar);
        return grammar;
    }

    visitGrammarContent(grammar: Grammar) {
        for (let i = 0; i < grammar.rules.length; i++) {
            grammar.rules[i] = this.visitRule(grammar.rules[i]);
        }
        for (let i = 0; i < grammar.prattRules.length; i++) {
            grammar.prattRules[i] = this.visitPrattRule(grammar.prattRules[i]);
        }
    }

    visitRule(rule: Rule): Rule {
        if (this.delegate.visitRule) return this.delegate.visitRule(rule, this) ?? rule;
        this.visitRuleContent(rule);
        return rule;
    }

    visitRuleContent(rule: Rule) {
        rule.body = this.visitRuleBody(rule.body);
        for (let i = 0; i < rule.versionAnnotations.length; i++) {
            rule.versionAnnotations[i] = this.visitVersionAnnotation(rule.versionAnnotations[i]);
        }
    }

    visitRuleBody(ruleBody: RuleBody): RuleBody {
        if (this.delegate.visitRuleBody) return this.delegate.visitRuleBody(ruleBody, this) ?? ruleBody;
        return this.dispatchRuleBody(ruleBody);
    }

    dispatchRuleBody(ruleBody: RuleBody): RuleBody {
        if (ruleBody instanceof SequenceRule) {
            return this.visitSequenceRule(ruleBody);
        } else if (ruleBody instanceof ChoiceRule) {
            return this.visitChoiceRule(ruleBody);
        } else if (ruleBody instanceof EnumRule) {
            return this.visitEnumRule(ruleBody);
        } else {
            return this.visitSeparatedByRule(ruleBody);
        }
    }

    visitSeparatedByRule(ruleBody: SeparatedByRule): RuleBody {
        if (this.delegate.visitSeparatedByRule) return this.delegate.visitSeparatedByRule(ruleBody, this) ?? ruleBody;
        this.visitSeparatedByRuleContent(ruleBody);
        return ruleBody;
    }

    visitSeparatedByRuleContent(ruleBody: SeparatedByRule) {
        ruleBody.element = this.visitRuleElement(ruleBody.element);
    }

    visitEnumRule(ruleBody: EnumRule): RuleBody {
        if (this.delegate.visitEnumRule) return this.delegate.visitEnumRule(ruleBody, this) ?? ruleBody;
        return ruleBody;
    }

    visitPrattRule(rule: PrattRule): PrattRule {
        if (this.delegate.visitPrattRule) return this.delegate.visitPrattRule(rule, this) ?? rule;
        this.visitPrattRuleContent(rule);
        return rule;
    }

    visitPrattRuleContent(rule: PrattRule) {
        for (let i = 0; i < rule.operators.length; i++) rule.operators[i] = this.visitPrattOperator(rule.operators[i]);
        rule.primary = this.visitPrattPrimary(rule.primary);
        for (let i = 0; i < rule.versionAnnotations.length; i++) {
            rule.versionAnnotations[i] = this.visitVersionAnnotation(rule.versionAnnotations[i]);
        }
    }

    visitPrattOperator(operator: PrattOperator): PrattOperator {
        if (this.delegate.visitPrattOperator) return this.delegate.visitPrattOperator(operator, this) ?? operator;
        this.visitPrattOperatorContent(operator);
        return operator;
    }

    visitPrattOperatorContent(operator: PrattOperator) {
        operator.body = this.visitRuleBody(operator.body);
        for (let i = 0; i < operator.versionAnnotations.length; i++) {
            operator.versionAnnotations[i] = this.visitVersionAnnotation(operator.versionAnnotations[i]);
        }
    }

    visitPrattPrimary(primary: PrattPrimary): PrattPrimary {
        if (this.delegate.visitPrattPrimary) return this.delegate.visitPrattPrimary(primary, this) ?? primary;
        this.visitPrattPrimaryContent(primary);
        return primary;
    }

    visitPrattPrimaryContent(primary: PrattPrimary) {
        primary.body = this.visitRuleBody(primary.body);
    }

    visitSequenceRule(sequenceRule: SequenceRule): SequenceRule {
        if (this.delegate.visitSequenceRule) return this.delegate.visitSequenceRule(sequenceRule, this) ?? sequenceRule;
        this.visitSequenceRuleContent(sequenceRule);
        return sequenceRule;
    }

    visitSequenceRuleContent(sequenceRule: SequenceRule) {
        for (let i = 0; i < sequenceRule.elements.length; i++) {
            sequenceRule.elements[i] = this.visitRuleElement(sequenceRule.elements[i]);
        }
    }

    visitRuleElement(ruleElement: RuleElement): RuleElement {
        if (this.delegate.visitRuleElement) return this.delegate.visitRuleElement(ruleElement, this) ?? ruleElement;
        return this.dispatchRuleElement(ruleElement);
    }

    dispatchRuleElement(ruleElement: RuleElement): RuleElement {
        if (ruleElement instanceof CountedRuleElement) {
            return this.visitCountedRuleElement(ruleElement);
        } else {
            // if (ruleElement instanceof NegativeLookahead) {
            return this.visitNegativeLookahead(ruleElement);
        }
    }

    visitCharSet(charSet: CharSet): CharSet {
        if (this.delegate.visitCharSet) return this.delegate.visitCharSet(charSet, this) ?? charSet;
        return charSet;
    }

    visitNegativeLookahead(negativeLookahead: NegativeLookahead): NegativeLookahead {
        if (this.delegate.visitNegativeLookahead)
            return this.delegate.visitNegativeLookahead(negativeLookahead, this) ?? negativeLookahead;
        this.visitNegativeLookaheadContent(negativeLookahead);
        return negativeLookahead;
    }

    visitNegativeLookaheadContent(negativeLookahead: NegativeLookahead) {
        negativeLookahead.content = this.dispatchNegativeLookaheadContent(negativeLookahead.content);
    }

    dispatchNegativeLookaheadContent(content: CharSet | StringElement) {
        if (content instanceof CharSet) {
            return this.visitCharSet(content);
        } else {
            // if (content instanceof StringElement) {
            return this.visitStringElement(content);
        }
    }

    visitChoiceRule(rules: ChoiceRule): ChoiceRule {
        if (this.delegate.visitChoiceRule) return this.delegate.visitChoiceRule(rules, this) ?? rules;
        this.visitChoiceRuleContent(rules);
        return rules;
    }

    visitChoiceRuleContent(rules: ChoiceRule) {
        for (let i = 0; i < rules.choices.length; i++) {
            rules.choices[i] = this.visitSequenceRule(rules.choices[i]);
        }
    }

    visitCountedRuleElement(element: CountedRuleElement): CountedRuleElement {
        if (this.delegate.visitCountedRuleElement) {
            return this.delegate.visitCountedRuleElement(element, this) ?? element;
        }
        this.visitCountedRuleElementContent(element);
        return element;
    }

    visitCountedRuleElementContent(element: CountedRuleElement) {
        element.countableRuleElement = this.visitCountableRuleElement(element.countableRuleElement);
        for (let i = 0; i < element.versionAnnotations.length; i++) {
            element.versionAnnotations[i] = this.visitVersionAnnotation(element.versionAnnotations[i]);
        }
    }

    visitCountableRuleElement(cre: CountableRuleElement): CountableRuleElement {
        if (this.delegate.visitCountableRuleElement) return this.delegate.visitCountableRuleElement(cre, this) ?? cre;

        return this.dispatchCountableRuleElement(cre);
    }

    dispatchCountableRuleElement(cre: CountableRuleElement): CountableRuleElement {
        if (cre instanceof RuleReference) {
            return this.visitRuleReference(cre);
        } else if (cre instanceof AnyElement) {
            return this.visitAnyElement(cre);
        } else if (cre instanceof StringElement) {
            return this.visitStringElement(cre);
        } else if (cre instanceof CharSet) {
            return this.visitCharSet(cre);
        } else {
            // if (cre instanceof RuleBody) {
            return this.visitRuleBody(cre);
        }
    }

    visitRuleReference(ruleReference: RuleReference): RuleReference {
        if (this.delegate.visitRuleReference)
            return this.delegate.visitRuleReference(ruleReference, this) ?? ruleReference;
        return ruleReference;
    }

    visitStringElement(string: StringElement): StringElement {
        if (this.delegate.visitStringElement) return this.delegate.visitStringElement(string, this) ?? string;
        return string;
    }

    visitAnyElement(anyElement: AnyElement): AnyElement {
        if (this.delegate.visitAnyElement) return this.delegate.visitAnyElement(anyElement, this) ?? anyElement;
        return anyElement;
    }

    visitVersionAnnotation(versionAnnotation: VersionAnnotation): VersionAnnotation {
        if (this.delegate.visitVersionAnnotation)
            return this.delegate.visitVersionAnnotation(versionAnnotation, this) ?? versionAnnotation;
        this.visitVersionAnnotationContent(versionAnnotation);
        return versionAnnotation;
    }

    visitVersionAnnotationContent(versionAnnotation: VersionAnnotation) {
        versionAnnotation.version = this.visitVersionNumber(versionAnnotation.version);
    }

    visitVersionNumber(versionNumber: VersionNumber): VersionNumber {
        if (this.delegate.visitVersionNumber)
            return this.delegate.visitVersionNumber(versionNumber, this) ?? versionNumber;
        // VersionSegment doesn't need to be visited
        return versionNumber;
    }
}
