import * as Model from './model';

export class Visitor {
    visitGrammar(grammar: Model.Grammar): void {
        grammar.rules.forEach((rule) => this.visitRule(rule));
        grammar.prattRules.forEach((rule) => this.visitPrattRule(rule));
    }
    visitRule(rule: Model.Rule): void {
        rule.versionAnnotations.forEach((va) => this.visitVersionAnnotation(va));
        this.visitRuleBody(rule.body);
    }
    visitRuleBody(ruleBody: Model.RuleBody): void {
        if (ruleBody instanceof Model.ChoiceRule) {
            this.visitChoiceRule(ruleBody);
        } else {
            // ruleBody instanceof SequenceRule
            this.visitSequenceRule(ruleBody);
        }
    }
    visitPrattRule(rule: Model.PrattRule): void {
        rule.versionAnnotations.forEach((va) => this.visitVersionAnnotation(va));
        this.visitPrattOperator(rule.operators[0]);
        this.visitPrattPrimary(rule.primary);
    }
    visitPrattOperator(operator: Model.PrattOperator): void {
        operator.versionAnnotations.forEach((va) => this.visitVersionAnnotation(va));
        this.visitRuleBody(operator.body);
    }
    visitPrattPrimary(primary: Model.PrattPrimary): void {
        this.visitRuleBody(primary.body);
    }
    visitSequenceRule(sequenceRule: Model.SequenceRule): void {
        sequenceRule.elements.forEach((el) => this.visitRuleElement(el));
    }
    visitRuleElement(ruleElement: Model.RuleElement): void {
        if (ruleElement instanceof Model.CountedRuleElement) {
            this.visitCountedRuleElement(ruleElement);
        } else {
            // ruleElement instanceof NegativeLookahead
            this.visitNegativeLookahead(ruleElement);
        }
    }
    visitChoiceRule(rules: Model.ChoiceRule): void {
        rules.choices.forEach((x) => this.visitSequenceRule(x));
    }
    visitCountableRuleElement(cre: Model.CountableRuleElement): void {
        if (cre instanceof Model.RuleReference) {
            this.visitRuleReference(cre);
        } else if (cre instanceof Model.AnyElement) {
            this.visitAnyElement(cre);
        } else if (cre instanceof Model.StringElement) {
            this.visitStringElement(cre);
        } else if (cre instanceof Model.CharSet) {
            this.visitCharSet(cre);
        } else {
            // cre instanceof Model.RuleBody
            this.visitRuleBody(cre);
        }
    }
    visitCountedRuleElement(element: Model.CountedRuleElement): void {
        this.visitCountableRuleElement(element.countableRuleElement);
        element.versionAnnotations.forEach((va) => this.visitVersionAnnotation(va));
    }
    visitNegativeLookahead(ruleElement: Model.NegativeLookahead): void {
        if (ruleElement.content instanceof Model.CharSet) {
            this.visitCharSet(ruleElement.content);
        } else {
            this.visitStringElement(ruleElement.content);
        }
    }
    visitRuleReference(ruleReference: Model.RuleReference): void {}
    visitStringElement(string: Model.StringElement): void {}
    visitCharSet(charSet: Model.CharSet): void {}
    visitAnyElement(anyElement: Model.AnyElement): void {}
    visitVersionAnnotation(versionAnnotation: Model.VersionAnnotation): void {}
}
