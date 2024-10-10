import {
    AnyElement,
    CharSet,
    ChoiceRule,
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
    VersionNumber
} from './model';

type VisitorResult<T> = T | void;

interface Traverser {
    visitGrammar(grammar: Grammar): Grammar;
    visitRule(rule: Rule): Rule;
    visitRuleBody(ruleBody: RuleBody): RuleBody;
    visitPrattRule(rule: PrattRule): PrattRule;
    visitPrattOperator(operator: PrattOperator): PrattOperator;
    visitPrattPrimary(primary: PrattPrimary): PrattPrimary;
    visitSequenceRule(sequenceRule: SequenceRule): SequenceRule;
    visitRuleElement(ruleElement: RuleElement): RuleElement;
    visitChoiceRule(rules: ChoiceRule): ChoiceRule;
    visitCountableRuleElement(cre: CountableRuleElement): CountableRuleElement;
    visitCountedRuleElement(element: CountedRuleElement): CountedRuleElement;
    visitNegativeLookahead(ruleElement: NegativeLookahead): NegativeLookahead;
    visitRuleReference(ruleReference: RuleReference): RuleReference;
    visitStringElement(string: StringElement): StringElement;
    visitCharSet(charSet: CharSet): CharSet;
    visitAnyElement(anyElement: AnyElement): AnyElement;
    visitVersionAnnotation(versionAnnotation: VersionAnnotation): VersionAnnotation;
    visitVersionNumber(versionNumber: VersionNumber): VersionNumber;
    next(): void;
}

export interface TraverseDelegate {
    visitGrammar?(grammar: Grammar, traverser: Traverser): VisitorResult<Grammar>;
    visitRule?(rule: Rule, traverser: Traverser): VisitorResult<Rule>;
    visitRuleBody?(ruleBody: RuleBody, traverser: Traverser): VisitorResult<RuleBody>;
    visitPrattRule?(rule: PrattRule, traverser: Traverser): VisitorResult<PrattRule>;
    visitPrattOperator?(operator: PrattOperator, traverser: Traverser): VisitorResult<PrattOperator>;
    visitPrattPrimary?(primary: PrattPrimary, traverser: Traverser): VisitorResult<PrattPrimary>;
    visitSequenceRule?(sequenceRule: SequenceRule, traverser: Traverser): VisitorResult<SequenceRule>;
    visitRuleElement?(ruleElement: RuleElement, traverser: Traverser): VisitorResult<RuleElement>;
    visitChoiceRule?(rules: ChoiceRule, traverser: Traverser): VisitorResult<ChoiceRule>;
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
}

class TraverserProxy implements Traverser {
    constructor(
        private engine: TraverserEngine,
        private nextTraversal?: () => void
    ) {}

    next(): void {
        this.nextTraversal?.();
    }

    visitGrammar(grammar: Grammar): Grammar {
        return this.engine.visitGrammar(grammar);
    }

    visitRule(rule: Rule): Rule {
        return this.engine.visitRule(rule);
    }

    visitRuleBody(ruleBody: RuleBody): RuleBody {
        return this.engine.visitRuleBody(ruleBody);
    }

    visitPrattRule(rule: PrattRule): PrattRule {
        return this.engine.visitPrattRule(rule);
    }

    visitPrattOperator(operator: PrattOperator): PrattOperator {
        return this.engine.visitPrattOperator(operator);
    }

    visitPrattPrimary(primary: PrattPrimary): PrattPrimary {
        return this.engine.visitPrattPrimary(primary);
    }

    visitSequenceRule(sequenceRule: SequenceRule): SequenceRule {
        return this.engine.visitSequenceRule(sequenceRule);
    }

    visitRuleElement(ruleElement: RuleElement): RuleElement {
        return this.engine.visitRuleElement(ruleElement);
    }

    visitChoiceRule(rules: ChoiceRule): ChoiceRule {
        return this.engine.visitChoiceRule(rules);
    }

    visitCountableRuleElement(cre: CountableRuleElement): CountableRuleElement {
        return this.engine.visitCountableRuleElement(cre);
    }

    visitCountedRuleElement(element: CountedRuleElement): CountedRuleElement {
        return this.engine.visitCountedRuleElement(element);
    }

    visitNegativeLookahead(ruleElement: NegativeLookahead): NegativeLookahead {
        return this.engine.visitNegativeLookahead(ruleElement);
    }

    visitRuleReference(ruleReference: RuleReference): RuleReference {
        return this.engine.visitRuleReference(ruleReference);
    }

    visitStringElement(string: StringElement): StringElement {
        return this.engine.visitStringElement(string);
    }

    visitCharSet(charSet: CharSet): CharSet {
        return this.engine.visitCharSet(charSet);
    }

    visitAnyElement(anyElement: AnyElement): AnyElement {
        return this.engine.visitAnyElement(anyElement);
    }

    visitVersionAnnotation(versionAnnotation: VersionAnnotation): VersionAnnotation {
        return this.engine.visitVersionAnnotation(versionAnnotation);
    }

    visitVersionNumber(versionNumber: VersionNumber): VersionNumber {
        return this.engine.visitVersionNumber(versionNumber);
    }
}

export class TraverserEngine implements Traverser {
    constructor(public delegate: TraverseDelegate) {}

    private visit<N>(node: N, visitorMethod: keyof TraverseDelegate, nextTraversal?: () => void): N {
        const visitor = this.delegate[visitorMethod] as
            | ((node: N, traverser: Traverser) => VisitorResult<N>)
            | undefined;
        if (visitor) {
            const proxy = nextTraversal ? new TraverserProxy(this, nextTraversal) : this;
            return visitor.call(this.delegate, node, proxy) ?? node;
        } else {
            nextTraversal?.();
            return node;
        }
    }

    visitGrammar(grammar: Grammar): Grammar {
        return this.visit(grammar, 'visitGrammar', () => {
            grammar.rules = grammar.rules.map((rule) => this.visitRule(rule));
            grammar.prattRules = grammar.prattRules.map((rule) => this.visitPrattRule(rule));
        });
    }

    visitRule(rule: Rule): Rule {
        return this.visit(rule, 'visitRule', () => {
            rule.body = this.visitRuleBody(rule.body);
            rule.versionAnnotations = rule.versionAnnotations.map((va) => this.visitVersionAnnotation(va));
        });
    }

    visitRuleBody(ruleBody: RuleBody): RuleBody {
        return this.visit(ruleBody, 'visitRuleBody', () => {
            // TODO: not sure if this is the right approach
            // because dispatching on the concrete type isn't
            // the same is visiting the content
            if (ruleBody instanceof SequenceRule) {
                return this.visitSequenceRule(ruleBody);
            } else {
                return this.visitChoiceRule(ruleBody);
            }
        });
    }

    visitPrattRule(rule: PrattRule): PrattRule {
        return this.visit(rule, 'visitPrattRule', () => {
            rule.operators = rule.operators.map((op) => this.visitPrattOperator(op));
            rule.primary = this.visitPrattPrimary(rule.primary);
            rule.versionAnnotations = rule.versionAnnotations.map((va) => this.visitVersionAnnotation(va));
        });
    }

    visitPrattOperator(operator: PrattOperator): PrattOperator {
        return this.visit(operator, 'visitPrattOperator', () => {
            operator.body = this.visitRuleBody(operator.body);
            operator.versionAnnotations = operator.versionAnnotations.map((va) => this.visitVersionAnnotation(va));
        });
    }

    visitPrattPrimary(primary: PrattPrimary): PrattPrimary {
        return this.visit(primary, 'visitPrattPrimary', () => {
            primary.body = this.visitRuleBody(primary.body);
        });
    }

    visitSequenceRule(sequenceRule: SequenceRule): SequenceRule {
        return this.visit(sequenceRule, 'visitSequenceRule', () => {
            sequenceRule.elements = sequenceRule.elements.map((el: RuleElement) => this.visitRuleElement(el));
        });
    }

    visitRuleElement(ruleElement: RuleElement): RuleElement {
        return this.visit(ruleElement, 'visitRuleElement', () => {
            // TODO: not sure if this is the right approach
            // because dispatching on the concrete type isn't
            // the same is visiting the content
            if (ruleElement instanceof CountedRuleElement) {
                return this.visitCountedRuleElement(ruleElement);
            } else {
                return this.visitNegativeLookahead(ruleElement);
            }
        });
    }

    visitCharSet(charSet: CharSet): CharSet {
        return this.visit(charSet, 'visitCharSet');
    }

    visitNegativeLookahead(negativeLookahead: NegativeLookahead): NegativeLookahead {
        return this.visit(negativeLookahead, 'visitNegativeLookahead', () => {
            negativeLookahead.content =
                negativeLookahead.content instanceof CharSet
                    ? this.visitCharSet(negativeLookahead.content)
                    : this.visitStringElement(negativeLookahead.content);
        });
    }

    visitChoiceRule(rules: ChoiceRule): ChoiceRule {
        return this.visit(rules, 'visitChoiceRule', () => {
            rules.choices = rules.choices.map((choice: SequenceRule) => this.visitSequenceRule(choice));
        });
    }

    visitCountedRuleElement(element: CountedRuleElement): CountedRuleElement {
        return this.visit(element, 'visitCountedRuleElement', () => {
            element.countableRuleElement = this.visitCountableRuleElement(element.countableRuleElement);
            element.versionAnnotations = element.versionAnnotations.map((va) => this.visitVersionAnnotation(va));
        });
    }

    visitCountableRuleElement(cre: CountableRuleElement): CountableRuleElement {
        return this.visit(cre, 'visitCountableRuleElement', () => {
            // TODO: not sure if this is the right approach
            // because dispatching on the concrete type isn't
            // the same is visiting the content
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
        return this.visit(ruleReference, 'visitRuleReference');
    }

    visitStringElement(string: StringElement): StringElement {
        return this.visit(string, 'visitStringElement');
    }

    visitAnyElement(anyElement: AnyElement): AnyElement {
        return this.visit(anyElement, 'visitAnyElement');
    }

    visitVersionAnnotation(versionAnnotation: VersionAnnotation): VersionAnnotation {
        return this.visit(versionAnnotation, 'visitVersionAnnotation', () => {
            versionAnnotation.version = this.visitVersionNumber(versionAnnotation.version);
        });
    }

    visitVersionNumber(versionNumber: VersionNumber): VersionNumber {
        return this.visit(versionNumber, 'visitVersionNumber');
    }

    next(): void {}
}
