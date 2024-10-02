import {
    AlternativeRule,
    AlternativeRules,
    AnyElement,
    CharSet,
    CharSetChar,
    CountableRuleElement,
    CountedRuleElement,
    Grammar,
    GrammarLanguage,
    IdentifierRule,
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
    VersionNumber
} from './model';

export interface TraverseDelegate {
    visitGrammar?(grammar: Grammar, traverser: Traverser): Grammar;

    visitRule?(rule: Rule, traverser: Traverser): Rule;

    visitRuleBody?(ruleBody: RuleBody, traverser: Traverser): RuleBody;

    visitPrattRule?(rule: PrattRule, traverser: Traverser): PrattRule;

    visitPrattOperator?(
        operator: PrattOperator,
        traverser: Traverser
    ): PrattOperator;

    visitPrattPrimary?(
        primary: PrattPrimary,
        traverser: Traverser
    ): PrattPrimary;

    visitIdentifierRule?(
        rule: IdentifierRule,
        traverser: Traverser
    ): IdentifierRule;

    visitSequenceRule?(
        sequenceRule: SequenceRule,
        traverser: Traverser
    ): SequenceRule;

    visitRuleElement?(
        ruleElement: RuleElement,
        traverser: Traverser
    ): RuleElement;

    visitAlternativeRules?(
        rules: AlternativeRules,
        traverser: Traverser
    ): AlternativeRules;

    visitAlternativeRule?(
        rule: AlternativeRule,
        traverser: Traverser
    ): AlternativeRule;

    visitCountableRuleElement?(
        cre: CountableRuleElement,
        traverser: Traverser
    ): CountableRuleElement;

    visitCountedRuleElement?(
        element: CountedRuleElement,
        traverser: Traverser
    ): CountedRuleElement;

    visitNegativeLookahead?(
        ruleElement: NegativeLookahead,
        traverser: Traverser
    ): NegativeLookahead;

    visitRuleReference?(
        ruleReference: RuleReference,
        traverser: Traverser
    ): RuleReference;

    visitStringElement?(
        string: StringElement,
        traverser: Traverser
    ): StringElement;

    visitCharSet?(charSet: CharSet, traverser: Traverser): CharSet;

    visitAnyElement?(anyElement: AnyElement, traverser: Traverser): AnyElement;

    visitCharSetRange?(
        range: { startChar: CharSetChar; endChar?: CharSetChar },
        traverser: Traverser
    ): { startChar: CharSetChar; endChar?: CharSetChar };

    visitVersionAnnotation?(
        versionAnnotation: VersionAnnotation,
        traverser: Traverser
    ): VersionAnnotation;

    visitVersionNumber?(
        versionNumber: VersionNumber,
        traverser: Traverser
    ): VersionNumber;
}

export class Traverser {
    constructor(public delegate: TraverseDelegate) {}

    visitGrammar(grammar: Grammar): Grammar {
        if (this.delegate.visitGrammar)
            return this.delegate.visitGrammar(grammar, this);
        this.visitGrammarChildren(grammar);
        return grammar;
    }

    visitGrammarChildren(grammar: Grammar) {
        for (let i = 0; i < grammar.rules.length; i++) {
            grammar.rules[i] = this.dispatchGrammarRule(grammar.rules[i]);
        }
    }

    dispatchGrammarRule(rule: Rule | PrattRule | IdentifierRule) {
        if (rule instanceof Rule) {
            return this.visitRule(rule);
        } else if (rule instanceof PrattRule) {
            return this.visitPrattRule(rule);
        } else {
            // if (rule instanceof IdentifierRule) {
            return this.visitIdentifierRule(rule);
        }
    }

    visitRule(rule: Rule): Rule {
        if (this.delegate.visitRule) return this.delegate.visitRule(rule, this);
        this.visitRuleChildren(rule);
        return rule;
    }

    visitRuleChildren(rule: Rule) {
        rule.body = this.visitRuleBody(rule.body);
        if (rule.annotation) {
            // Assuming annotation doesn't need to be visited
        }
        for (let i = 0; i < rule.versionAnnotations.length; i++) {
            rule.versionAnnotations[i] = this.visitVersionAnnotation(
                rule.versionAnnotations[i]
            );
        }
    }

    visitRuleBody(ruleBody: RuleBody): RuleBody {
        if (this.delegate.visitRuleBody)
            return this.delegate.visitRuleBody(ruleBody, this);
        return this.dispatchRuleBody(ruleBody);
    }

    dispatchRuleBody(ruleBody: RuleBody): RuleBody {
        if (ruleBody instanceof SequenceRule) {
            return this.visitSequenceRule(ruleBody);
        } else {
            // if (ruleBody instanceof AlternativeRules) {
            return this.visitAlternativeRules(ruleBody);
        }
    }

    visitPrattRule(rule: PrattRule): PrattRule {
        if (this.delegate.visitPrattRule)
            return this.delegate.visitPrattRule(rule, this);
        this.visitPrattRuleChildren(rule);
        return rule;
    }

    visitPrattRuleChildren(rule: PrattRule) {
        for (let i = 0; i < rule.operators.length; i++)
            rule.operators[i] = this.visitPrattOperator(rule.operators[i]);
        rule.primary = this.visitPrattPrimary(rule.primary);
        for (let i = 0; i < rule.versionAnnotations.length; i++) {
            rule.versionAnnotations[i] = this.visitVersionAnnotation(
                rule.versionAnnotations[i]
            );
        }
    }

    visitPrattOperator(operator: PrattOperator): PrattOperator {
        if (this.delegate.visitPrattOperator)
            return this.delegate.visitPrattOperator(operator, this);
        this.visitPrattOperatorChildren(operator);
        return operator;
    }

    visitPrattOperatorChildren(operator: PrattOperator) {
        operator.body = this.visitRuleBody(operator.body);
        for (let i = 0; i < operator.versionAnnotations.length; i++) {
            operator.versionAnnotations[i] = this.visitVersionAnnotation(
                operator.versionAnnotations[i]
            );
        }
    }

    visitPrattPrimary(primary: PrattPrimary): PrattPrimary {
        if (this.delegate.visitPrattPrimary)
            return this.delegate.visitPrattPrimary(primary, this);
        this.visitPrattPrimaryChildren(primary);
        return primary;
    }

    visitPrattPrimaryChildren(primary: PrattPrimary) {
        primary.body = this.visitRuleBody(primary.body);
    }

    visitIdentifierRule(rule: IdentifierRule): IdentifierRule {
        if (this.delegate.visitIdentifierRule)
            return this.delegate.visitIdentifierRule(rule, this);
        this.visitIdentifierRuleChildren(rule);
        return rule;
    }

    visitIdentifierRuleChildren(rule: IdentifierRule) {
        for (let i = 0; i < rule.ruleBodies.length; i++) {
            rule.ruleBodies[i] = this.visitRuleBody(rule.ruleBodies[i]);
        }
        if (rule.ruleAnnotation) {
            // Assuming ruleAnnotation doesn't need to be visited
        }
        for (let i = 0; i < rule.versionAnnotations.length; i++) {
            rule.versionAnnotations[i] = this.visitVersionAnnotation(
                rule.versionAnnotations[i]
            );
        }
    }

    visitSequenceRule(sequenceRule: SequenceRule): SequenceRule {
        if (this.delegate.visitSequenceRule)
            return this.delegate.visitSequenceRule(sequenceRule, this);
        this.visitSequenceRuleChildren(sequenceRule);
        return sequenceRule;
    }

    visitSequenceRuleChildren(sequenceRule: SequenceRule) {
        for (let i = 0; i < sequenceRule.elements.length; i++) {
            sequenceRule.elements[i] = this.visitRuleElement(
                sequenceRule.elements[i]
            );
        }
    }

    visitRuleElement(ruleElement: RuleElement): RuleElement {
        if (this.delegate.visitRuleElement)
            return this.delegate.visitRuleElement(ruleElement, this);
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
        if (this.delegate.visitCharSet)
            return this.delegate.visitCharSet(charSet, this);
        this.visitCharSetChildren(charSet);
        return charSet;
    }

    visitCharSetChildren(charSet: CharSet) {
        for (let i = 0; i < charSet.ranges.length; i++) {
            charSet.ranges[i] = this.visitCharSetRange(charSet.ranges[i]);
        }
    }

    visitCharSetRange(range: {
        startChar: CharSetChar;
        endChar?: CharSetChar;
    }): { startChar: CharSetChar; endChar?: CharSetChar } {
        if (this.delegate.visitCharSetRange)
            return this.delegate.visitCharSetRange(range, this);
        return range;
    }

    visitNegativeLookahead(
        negativeLookahead: NegativeLookahead
    ): NegativeLookahead {
        if (this.delegate.visitNegativeLookahead)
            return this.delegate.visitNegativeLookahead(
                negativeLookahead,
                this
            );
        this.visitNegativeLookaheadChildren(negativeLookahead);
        return negativeLookahead;
    }

    visitNegativeLookaheadChildren(negativeLookahead: NegativeLookahead) {
        negativeLookahead.content = this.dispatchNegativeLookaheadContent(
            negativeLookahead.content
        );
    }

    dispatchNegativeLookaheadContent(content: CharSet | StringElement) {
        if (content instanceof CharSet) {
            return this.visitCharSet(content);
        } else {
            // if (content instanceof StringElement) {
            return this.visitStringElement(content);
        }
    }

    visitAlternativeRules(rules: AlternativeRules): AlternativeRules {
        if (this.delegate.visitAlternativeRules)
            return this.delegate.visitAlternativeRules(rules, this);
        this.visitAlternativeRulesChildren(rules);
        return rules;
    }

    visitAlternativeRulesChildren(rules: AlternativeRules) {
        for (let i = 0; i < rules.alternatives.length; i++) {
            rules.alternatives[i] = this.visitAlternativeRule(
                rules.alternatives[i]
            );
        }
    }

    visitAlternativeRule(alternative: AlternativeRule): AlternativeRule {
        if (this.delegate.visitAlternativeRule)
            return this.delegate.visitAlternativeRule(alternative, this);
        this.visitAlternativeRuleChildren(alternative);
        return alternative;
    }

    visitAlternativeRuleChildren(alternative: AlternativeRule) {
        alternative.sequenceRule = this.visitSequenceRule(
            alternative.sequenceRule
        );
        for (let i = 0; i < alternative.versionAnnotations.length; i++) {
            alternative.versionAnnotations[i] = this.visitVersionAnnotation(
                alternative.versionAnnotations[i]
            );
        }
    }

    visitCountedRuleElement(element: CountedRuleElement): CountedRuleElement {
        if (this.delegate.visitCountedRuleElement) {
            return this.delegate.visitCountedRuleElement(element, this);
        }
        this.visitCountedRuleElementChildren(element);
        return element;
    }

    visitCountedRuleElementChildren(element: CountedRuleElement) {
        element.countableRuleElement = this.visitCountableRuleElement(
            element.countableRuleElement
        );
        for (let i = 0; i < element.versionAnnotations.length; i++) {
            element.versionAnnotations[i] = this.visitVersionAnnotation(
                element.versionAnnotations[i]
            );
        }
    }

    visitCountableRuleElement(cre: CountableRuleElement): CountableRuleElement {
        if (this.delegate.visitCountableRuleElement)
            return this.delegate.visitCountableRuleElement(cre, this);

        return this.dispatchCountableRuleElement(cre);
    }

    dispatchCountableRuleElement(
        cre: CountableRuleElement
    ): CountableRuleElement {
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
            return this.delegate.visitRuleReference(ruleReference, this);
        return ruleReference;
    }

    visitStringElement(string: StringElement): StringElement {
        if (this.delegate.visitStringElement)
            return this.delegate.visitStringElement(string, this);
        return string;
    }

    visitAnyElement(anyElement: AnyElement): AnyElement {
        if (this.delegate.visitAnyElement)
            return this.delegate.visitAnyElement(anyElement, this);
        return anyElement;
    }

    visitVersionAnnotation(
        versionAnnotation: VersionAnnotation
    ): VersionAnnotation {
        if (this.delegate.visitVersionAnnotation)
            return this.delegate.visitVersionAnnotation(
                versionAnnotation,
                this
            );
        this.visitVersionAnnotationChildren(versionAnnotation);
        return versionAnnotation;
    }

    visitVersionAnnotationChildren(versionAnnotation: VersionAnnotation) {
        versionAnnotation.version = this.visitVersionNumber(
            versionAnnotation.version
        );
    }

    visitVersionNumber(versionNumber: VersionNumber): VersionNumber {
        if (this.delegate.visitVersionNumber)
            return this.delegate.visitVersionNumber(versionNumber, this);
        // VersionSegment doesn't need to be visited
        return versionNumber;
    }
}
