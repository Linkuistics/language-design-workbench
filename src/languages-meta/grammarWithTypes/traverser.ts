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

export interface TraverseDelegate {
    visitGrammar?(grammar: Grammar, traverser: Traverser): Grammar | void;

    visitRule?(rule: Rule, traverser: Traverser): Rule | void;

    visitRuleBody?(ruleBody: RuleBody, traverser: Traverser): RuleBody | void;

    visitPrattRule?(rule: PrattRule, traverser: Traverser): PrattRule | void;

    visitPrattOperator?(operator: PrattOperator, traverser: Traverser): PrattOperator | void;

    visitPrattPrimary?(primary: PrattPrimary, traverser: Traverser): PrattPrimary | void;

    visitChoiceRule?(rules: ChoiceRule, traverser: Traverser): ChoiceRule | void;

    visitSequenceRule?(sequenceRule: SequenceRule, traverser: Traverser): SequenceRule | void;

    visitEnumRule?(ruleBody: EnumRule, traverser: Traverser): RuleBody | void;

    visitSeparatedByRule?(ruleBody: SeparatedByRule, traverser: Traverser): RuleBody | void;

    visitRuleElement?(ruleElement: RuleElement, traverser: Traverser): RuleElement | void;

    visitCountableRuleElement?(cre: CountableRuleElement, traverser: Traverser): CountableRuleElement | void;

    visitCountedRuleElement?(element: CountedRuleElement, traverser: Traverser): CountedRuleElement | void;

    visitNegativeLookahead?(ruleElement: NegativeLookahead, traverser: Traverser): NegativeLookahead | void;

    visitRuleReference?(ruleReference: RuleReference, traverser: Traverser): RuleReference | void;

    visitStringElement?(string: StringElement, traverser: Traverser): StringElement | void;

    visitCharSet?(charSet: CharSet, traverser: Traverser): CharSet | void;

    visitAnyElement?(anyElement: AnyElement, traverser: Traverser): AnyElement | void;

    visitVersionAnnotation?(versionAnnotation: VersionAnnotation, traverser: Traverser): VersionAnnotation | void;

    visitVersionNumber?(versionNumber: VersionNumber, traverser: Traverser): VersionNumber | void;

    visitField?(field: Field, traverser: Traverser): Field | void;
}

export class Traverser {
    constructor(public delegate: TraverseDelegate) {}

    visitGrammar(grammar: Grammar): Grammar {
        if (this.delegate.visitGrammar) {
            const result = this.delegate.visitGrammar(grammar, this);
            return result ?? grammar;
        }
        this.visitGrammarChildren(grammar);
        return grammar;
    }

    visitGrammarChildren(grammar: Grammar) {
        for (let i = 0; i < grammar.rules.length; i++) {
            grammar.rules[i] = this.visitRule(grammar.rules[i]);
        }
        for (let i = 0; i < grammar.prattRules.length; i++) {
            grammar.prattRules[i] = this.visitPrattRule(grammar.prattRules[i]);
        }
    }

    visitRule(rule: Rule): Rule {
        if (this.delegate.visitRule) {
            const result = this.delegate.visitRule(rule, this);
            return result ?? rule;
        }
        this.visitRuleChildren(rule);
        return rule;
    }

    visitRuleChildren(rule: Rule) {
        rule.body = this.visitRuleBody(rule.body);
        for (let i = 0; i < rule.versionAnnotations.length; i++) {
            rule.versionAnnotations[i] = this.visitVersionAnnotation(rule.versionAnnotations[i]);
        }
    }

    visitRuleBody(ruleBody: RuleBody): RuleBody {
        if (this.delegate.visitRuleBody) {
            const result = this.delegate.visitRuleBody(ruleBody, this);
            return result ?? ruleBody;
        }
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

    visitPrattRule(rule: PrattRule): PrattRule {
        if (this.delegate.visitPrattRule) {
            const result = this.delegate.visitPrattRule(rule, this);
            return result ?? rule;
        }
        this.visitPrattRuleChildren(rule);
        return rule;
    }

    visitPrattRuleChildren(rule: PrattRule) {
        for (let i = 0; i < rule.operators.length; i++) {
            rule.operators[i] = this.visitPrattOperator(rule.operators[i]);
        }
        rule.primary = this.visitPrattPrimary(rule.primary);
        for (let i = 0; i < rule.versionAnnotations.length; i++) {
            rule.versionAnnotations[i] = this.visitVersionAnnotation(rule.versionAnnotations[i]);
        }
    }

    visitPrattOperator(operator: PrattOperator): PrattOperator {
        if (this.delegate.visitPrattOperator) {
            const result = this.delegate.visitPrattOperator(operator, this);
            return result ?? operator;
        }
        this.visitPrattOperatorChildren(operator);
        return operator;
    }

    visitPrattOperatorChildren(operator: PrattOperator) {
        operator.body = this.visitRuleBody(operator.body);
        for (let i = 0; i < operator.versionAnnotations.length; i++) {
            operator.versionAnnotations[i] = this.visitVersionAnnotation(operator.versionAnnotations[i]);
        }
    }

    visitPrattPrimary(primary: PrattPrimary): PrattPrimary {
        if (this.delegate.visitPrattPrimary) {
            const result = this.delegate.visitPrattPrimary(primary, this);
            return result ?? primary;
        }
        this.visitPrattPrimaryChildren(primary);
        return primary;
    }

    visitPrattPrimaryChildren(primary: PrattPrimary) {
        primary.body = this.visitRuleBody(primary.body);
    }

    visitSequenceRule(sequenceRule: SequenceRule): SequenceRule {
        if (this.delegate.visitSequenceRule) {
            const result = this.delegate.visitSequenceRule(sequenceRule, this);
            return result ?? sequenceRule;
        }
        this.visitSequenceRuleChildren(sequenceRule);
        return sequenceRule;
    }

    visitSequenceRuleChildren(sequenceRule: SequenceRule) {
        for (let i = 0; i < sequenceRule.elements.length; i++) {
            sequenceRule.elements[i] = this.visitRuleElement(sequenceRule.elements[i]);
        }
    }

    visitEnumRule(rule: EnumRule): RuleBody {
        if (this.delegate.visitEnumRule) {
            const result = this.delegate.visitEnumRule(rule, this);
            return result ?? rule;
        }
        if (rule.field) {
            rule.field = this.visitField(rule.field);
        }
        return rule;
    }

    visitSeparatedByRule(rule: SeparatedByRule): RuleBody {
        if (this.delegate.visitSeparatedByRule) {
            const result = this.delegate.visitSeparatedByRule(rule, this);
            return result ?? rule;
        }
        this.visitSeparatedByRuleChildren(rule);
        return rule;
    }

    visitSeparatedByRuleChildren(rule: SeparatedByRule) {
        rule.element = this.visitRuleElement(rule.element);
    }

    visitRuleElement(ruleElement: RuleElement): RuleElement {
        if (this.delegate.visitRuleElement) {
            const result = this.delegate.visitRuleElement(ruleElement, this);
            return result ?? ruleElement;
        }
        return this.dispatchRuleElement(ruleElement);
    }

    dispatchRuleElement(ruleElement: RuleElement): RuleElement {
        if (ruleElement instanceof CountedRuleElement) {
            return this.visitCountedRuleElement(ruleElement);
        } else {
            return this.visitNegativeLookahead(ruleElement);
        }
    }

    visitCharSet(charSet: CharSet): CharSet {
        if (this.delegate.visitCharSet) {
            const result = this.delegate.visitCharSet(charSet, this);
            return result ?? charSet;
        }
        if (charSet.field) {
            charSet.field = this.visitField(charSet.field);
        }
        return charSet;
    }

    visitNegativeLookahead(negativeLookahead: NegativeLookahead): NegativeLookahead {
        if (this.delegate.visitNegativeLookahead) {
            const result = this.delegate.visitNegativeLookahead(negativeLookahead, this);
            return result ?? negativeLookahead;
        }
        this.visitNegativeLookaheadChildren(negativeLookahead);
        return negativeLookahead;
    }

    visitNegativeLookaheadChildren(negativeLookahead: NegativeLookahead) {
        negativeLookahead.content = this.dispatchNegativeLookaheadContent(negativeLookahead.content);
    }

    dispatchNegativeLookaheadContent(content: CharSet | StringElement): CharSet | StringElement {
        if (content instanceof CharSet) {
            return this.visitCharSet(content);
        } else {
            return this.visitStringElement(content);
        }
    }

    visitChoiceRule(rules: ChoiceRule): ChoiceRule {
        if (this.delegate.visitChoiceRule) {
            const result = this.delegate.visitChoiceRule(rules, this);
            return result ?? rules;
        }
        this.visitChoiceRuleChildren(rules);
        return rules;
    }

    visitChoiceRuleChildren(rules: ChoiceRule) {
        for (let i = 0; i < rules.choices.length; i++) {
            rules.choices[i] = this.visitSequenceRule(rules.choices[i]);
        }
    }

    visitCountedRuleElement(element: CountedRuleElement): CountedRuleElement {
        if (this.delegate.visitCountedRuleElement) {
            const result = this.delegate.visitCountedRuleElement(element, this);
            return result ?? element;
        }
        this.visitCountedRuleElementChildren(element);
        return element;
    }

    visitCountedRuleElementChildren(element: CountedRuleElement) {
        element.countableRuleElement = this.visitCountableRuleElement(element.countableRuleElement);
        for (let i = 0; i < element.versionAnnotations.length; i++) {
            element.versionAnnotations[i] = this.visitVersionAnnotation(element.versionAnnotations[i]);
        }
    }

    visitCountableRuleElement(cre: CountableRuleElement): CountableRuleElement {
        if (this.delegate.visitCountableRuleElement) {
            const result = this.delegate.visitCountableRuleElement(cre, this);
            return result ?? cre;
        }
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
            return this.visitRuleBody(cre);
        }
    }

    visitRuleReference(ruleReference: RuleReference): RuleReference {
        if (this.delegate.visitRuleReference) {
            const result = this.delegate.visitRuleReference(ruleReference, this);
            return result ?? ruleReference;
        }
        if (ruleReference.field) {
            ruleReference.field = this.visitField(ruleReference.field);
        }
        return ruleReference;
    }

    visitStringElement(stringElement: StringElement): StringElement {
        if (this.delegate.visitStringElement) {
            const result = this.delegate.visitStringElement(stringElement, this);
            return result ?? stringElement;
        }
        if (stringElement.field) {
            stringElement.field = this.visitField(stringElement.field);
        }
        return stringElement;
    }

    visitAnyElement(anyElement: AnyElement): AnyElement {
        if (this.delegate.visitAnyElement) {
            const result = this.delegate.visitAnyElement(anyElement, this);
            return result ?? anyElement;
        }
        if (anyElement.field) {
            anyElement.field = this.visitField(anyElement.field);
        }
        return anyElement;
    }

    visitVersionAnnotation(versionAnnotation: VersionAnnotation): VersionAnnotation {
        if (this.delegate.visitVersionAnnotation) {
            const result = this.delegate.visitVersionAnnotation(versionAnnotation, this);
            return result ?? versionAnnotation;
        }
        this.visitVersionAnnotationChildren(versionAnnotation);
        return versionAnnotation;
    }

    visitVersionAnnotationChildren(versionAnnotation: VersionAnnotation) {
        versionAnnotation.version = this.visitVersionNumber(versionAnnotation.version);
    }

    visitVersionNumber(versionNumber: VersionNumber): VersionNumber {
        if (this.delegate.visitVersionNumber) {
            const result = this.delegate.visitVersionNumber(versionNumber, this);
            return result ?? versionNumber;
        }
        return versionNumber;
    }

    visitField(field: Field): Field {
        if (this.delegate.visitField) {
            const result = this.delegate.visitField(field, this);
            return result ?? field;
        }
        return field;
    }
}
