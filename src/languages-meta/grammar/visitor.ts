import * as Model from './model';

export class Visitor {
    visitGrammar(grammar: Model.Grammar): void {
        grammar.rules.forEach((rule) => this.visitRule(rule));
        grammar.prattRules.forEach((rule) => this.visitPrattRule(rule));
    }

    visitRule(rule: Model.Rule): void {
        this.visitRuleBody(rule.body);
        rule.versionAnnotations.forEach((va) => this.visitVersionAnnotation(va));
    }

    visitRuleBody(ruleBody: Model.RuleBody): void {
        if (ruleBody instanceof Model.SequenceRule) {
            this.visitSequenceRule(ruleBody);
        } else {
            this.visitChoiceRule(ruleBody);
        }
    }

    visitPrattRule(rule: Model.PrattRule): void {
        rule.operators.forEach((op) => this.visitPrattOperator(op));
        this.visitPrattPrimary(rule.primary);
        rule.versionAnnotations.forEach((va) => this.visitVersionAnnotation(va));
    }

    visitPrattOperator(operator: Model.PrattOperator): void {
        this.visitRuleBody(operator.body);
        operator.versionAnnotations.forEach((va) => this.visitVersionAnnotation(va));
    }

    visitPrattPrimary(primary: Model.PrattPrimary): void {
        this.visitRuleBody(primary.body);
    }

    visitSequenceRule(sequenceRule: Model.SequenceRule): void {
        sequenceRule.elements.forEach((el: Model.RuleElement) => this.visitRuleElement(el));
    }

    visitRuleElement(ruleElement: Model.RuleElement): void {
        if (ruleElement instanceof Model.CountedRuleElement) {
            this.visitCountedRuleElement(ruleElement);
        } else {
            this.visitNegativeLookahead(ruleElement);
        }
    }

    visitCharSet(charSet: Model.CharSet): void {}

    visitNegativeLookahead(negativeLookahead: Model.NegativeLookahead): void {
        if (negativeLookahead.content instanceof Model.CharSet) {
            this.visitCharSet(negativeLookahead.content);
        } else {
            this.visitStringElement(negativeLookahead.content);
        }
    }

    visitChoiceRule(rules: Model.ChoiceRule): void {
        rules.choices.forEach((choice: Model.SequenceRule) => this.visitSequenceRule(choice));
    }

    visitCountedRuleElement(element: Model.CountedRuleElement): void {
        this.visitCountableRuleElement(element.countableRuleElement);
        element.versionAnnotations.forEach((va) => this.visitVersionAnnotation(va));
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
            this.visitRuleBody(cre);
        }
    }

    visitRuleReference(ruleReference: Model.RuleReference): void {}

    visitStringElement(string: Model.StringElement): void {}

    visitAnyElement(anyElement: Model.AnyElement): void {}

    visitVersionAnnotation(versionAnnotation: Model.VersionAnnotation): void {
        this.visitVersionNumber(versionAnnotation.version);
    }

    visitVersionNumber(versionNumber: Model.VersionNumber): void {}
}
