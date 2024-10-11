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
            return this.visitSequenceRule(ruleBody);
        } else if (ruleBody instanceof Model.ChoiceRule) {
            return this.visitChoiceRule(ruleBody);
        } else if (ruleBody instanceof Model.EnumRule) {
            return this.visitEnumRule(ruleBody);
        } else {
            return this.visitSeparatedByRule(ruleBody);
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
            return this.visitCountedRuleElement(ruleElement);
        } else {
            return this.visitNegativeLookahead(ruleElement);
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

    visitEnumRule(ruleBody: Model.EnumRule): void {
        if (ruleBody.field) this.visitField(ruleBody.field);
    }

    visitSeparatedByRule(ruleBody: Model.SeparatedByRule): void {
        this.visitRuleElement(ruleBody.element);
    }

    visitCountedRuleElement(element: Model.CountedRuleElement): void {
        this.visitCountableRuleElement(element.countableRuleElement);
        element.versionAnnotations.forEach((va) => this.visitVersionAnnotation(va));
    }

    visitCountableRuleElement(cre: Model.CountableRuleElement): void {
        if (cre instanceof Model.RuleReference) {
            return this.visitRuleReference(cre);
        } else if (cre instanceof Model.AnyElement) {
            return this.visitAnyElement(cre);
        } else if (cre instanceof Model.StringElement) {
            return this.visitStringElement(cre);
        } else if (cre instanceof Model.CharSet) {
            return this.visitCharSet(cre);
        } else {
            return this.visitRuleBody(cre);
        }
    }

    visitRuleReference(ruleReference: Model.RuleReference): void {
        if (ruleReference.field) this.visitField(ruleReference.field);
    }

    visitStringElement(stringElement: Model.StringElement): void {
        if (stringElement.field) this.visitField(stringElement.field);
    }

    visitAnyElement(anyElement: Model.AnyElement): void {
        if (anyElement.field) this.visitField(anyElement.field);
    }

    visitVersionAnnotation(versionAnnotation: Model.VersionAnnotation): void {
        this.visitVersionNumber(versionAnnotation.version);
    }

    visitVersionNumber(versionNumber: Model.VersionNumber): void {}

    visitField(field: Model.Field): void {}
}
