import {
    AlternativeRules,
    AnyElement,
    CharSet,
    CountableRuleElement,
    CountedRuleElement,
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
    StringElement
} from './model';

export interface TraverseDelegate {
    preVisitGrammar?(grammar: GrammarLanguage): void;
    postVisitGrammar?(grammar: GrammarLanguage): void;

    preVisitRule?(rule: Rule): void;
    postVisitRule?(rule: Rule): void;

    preVisitRuleBody?(ruleBody: RuleBody): void;
    postVisitRuleBody?(ruleBody: RuleBody): void;

    preVisitPrattRule?(rule: PrattRule): void;
    postVisitPrattRule?(rule: PrattRule): void;

    preVisitPrattOperator?(operator: PrattOperator): void;
    postVisitPrattOperator?(operator: PrattOperator): void;

    preVisitPrattPrimary?(primary: PrattPrimary): void;
    postVisitPrattPrimary?(primary: PrattPrimary): void;

    preVisitIdentifierRule?(rule: IdentifierRule): void;
    postVisitIdentifierRule?(rule: IdentifierRule): void;

    preVisitSequenceRule?(sequenceRule: SequenceRule): void;
    postVisitSequenceRule?(sequenceRule: SequenceRule): void;

    preVisitRuleElement?(ruleElement: RuleElement): void;
    postVisitRuleElement?(ruleElement: RuleElement): void;

    preVisitAlternativeRules?(rules: AlternativeRules): void;
    postVisitAlternativeRules?(rules: AlternativeRules): void;

    preVisitCountableRuleElement?(cre: CountableRuleElement): void;
    postVisitCountableRuleElement?(cre: CountableRuleElement): void;

    preVisitCountedRuleElement?(element: CountedRuleElement): void;
    postVisitCountedRuleElement?(element: CountedRuleElement): void;

    preVisitNegativeLookahead?(ruleElement: NegativeLookahead): void;
    postVisitNegativeLookahead?(ruleElement: NegativeLookahead): void;

    visitRuleReference?(ruleReference: RuleReference): void;
    visitStringElement?(string: StringElement): void;
    visitCharSet?(charSet: CharSet): void;
    visitAny?(any: AnyElement): void;
}

export class Traverser {
    constructor(public delegate: TraverseDelegate) {}

    processGrammar(grammar: GrammarLanguage) {
        this.delegate.preVisitGrammar?.(grammar);
        grammar.grammar.rules.forEach((rule) => {
            if (rule instanceof Rule) {
                this.processRule(rule);
            } else if (rule instanceof PrattRule) {
                this.processPrattRule(rule);
            } else {
                // if (rule instanceof IdentifierRule) {
                this.processIdentifierRule(rule);
            }
        });
        this.delegate.postVisitGrammar?.(grammar);
    }

    processRule(rule: Rule) {
        this.delegate.preVisitRule?.(rule);
        this.processRuleBody(rule.body);
        this.delegate.postVisitRule?.(rule);
    }

    processRuleBody(ruleBody: RuleBody) {
        this.delegate.preVisitRuleBody?.(ruleBody);
        if (ruleBody instanceof SequenceRule) {
            this.processSequenceRule(ruleBody);
        } else {
            // if (ruleBody instanceof AlternativeRules) {
            this.processAlternativeRules(ruleBody);
        }
        this.delegate.postVisitRuleBody?.(ruleBody);
    }

    processPrattRule(rule: PrattRule) {
        this.delegate.preVisitPrattRule?.(rule);
        rule.operators.forEach((operator) => {
            this.processPrattOperator(operator);
        });
        this.processPrattPrimary(rule.primary);
        this.delegate.postVisitPrattRule?.(rule);
    }

    processPrattOperator(operator: PrattOperator) {
        this.delegate.preVisitPrattOperator?.(operator);
        this.processRuleBody(operator.body);
        this.delegate.postVisitPrattOperator?.(operator);
    }

    processPrattPrimary(primary: PrattPrimary) {
        this.delegate.preVisitPrattPrimary?.(primary);
        this.processRuleBody(primary.body);
        this.delegate.postVisitPrattPrimary?.(primary);
    }

    processIdentifierRule(rule: IdentifierRule) {
        this.delegate.preVisitIdentifierRule?.(rule);
        rule.ruleBodies.forEach((ruleBody) => {
            this.processRuleBody(ruleBody);
        });
        this.delegate.postVisitIdentifierRule?.(rule);
    }

    processSequenceRule(sequenceRule: SequenceRule) {
        this.delegate.preVisitSequenceRule?.(sequenceRule);
        sequenceRule.elements.forEach((element) => {
            this.processRuleElement(element);
        });
        this.delegate.postVisitSequenceRule?.(sequenceRule);
    }

    processRuleElement(ruleElement: RuleElement) {
        this.delegate.preVisitRuleElement?.(ruleElement);
        if (ruleElement instanceof CountedRuleElement) {
            this.processCountedRuleElement(ruleElement);
        } else {
            // if (ruleElement instanceof NegativeLookahead) {
            this.processNegativeLookahead(ruleElement);
        }
        this.delegate.postVisitRuleElement?.(ruleElement);
    }

    processNegativeLookahead(ruleElement: NegativeLookahead) {
        this.delegate.preVisitNegativeLookahead?.(ruleElement);
        if (ruleElement.content instanceof CharSet) {
            this.delegate.visitCharSet?.(ruleElement.content);
        } else {
            // if (ruleElement.content instanceof StringElement) {
            this.delegate.visitStringElement?.(ruleElement.content);
        }
        this.delegate.postVisitNegativeLookahead?.(ruleElement);
    }

    processAlternativeRules(rules: AlternativeRules) {
        this.delegate.preVisitAlternativeRules?.(rules);
        rules.alternatives.forEach((alternative) =>
            this.processSequenceRule(alternative.sequenceRule)
        );
        this.delegate.postVisitAlternativeRules?.(rules);
    }

    processCountedRuleElement(element: CountedRuleElement) {
        this.delegate.preVisitCountedRuleElement?.(element);
        this.processCountableRuleElement(element.countableRuleElement);
        this.delegate.postVisitCountedRuleElement?.(element);
    }

    processCountableRuleElement(cre: CountableRuleElement) {
        this.delegate.preVisitCountableRuleElement?.(cre);
        if (cre instanceof RuleReference) {
            this.delegate.visitRuleReference?.(cre);
        } else if (cre instanceof AnyElement) {
            this.delegate.visitAny?.(cre);
        } else if (cre instanceof StringElement) {
            this.delegate.visitStringElement?.(cre);
        } else if (cre instanceof CharSet) {
            this.delegate.visitCharSet?.(cre);
        } else {
            // if (cre instanceof RuleBody) {
            this.processRuleBody(cre);
        }
        this.delegate.postVisitCountableRuleElement?.(cre);
    }
}
