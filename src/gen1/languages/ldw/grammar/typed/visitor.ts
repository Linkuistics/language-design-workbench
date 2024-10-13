import * as Model from './model';

export class Visitor {
    visitAnyElement(node: Model.AnyElement): void {}

    visitBlockComment(node: Model.BlockComment): void {}

    visitCharSet(node: Model.CharSet): void {}

    visitChoiceRule(node: Model.ChoiceRule): void {
        node.choices.forEach((x) => {
            this.visitSequenceRule(x);
        });
    }

    visitCountableRuleElement(node: Model.CountableRuleElement): void {
        if (node instanceof Model.RuleReference) {
            this.visitRuleReference(node);
        }
        if (node instanceof Model.StringElement) {
            this.visitStringElement(node);
        }
        if (node instanceof Model.CharSet) {
            this.visitCharSet(node);
        }
        if (node instanceof Model.AnyElement) {
            this.visitAnyElement(node);
        }
        if (node instanceof Model.ChoiceRule) {
            this.visitRuleBody(node);
        }
        if (node instanceof Model.SequenceRule) {
            this.visitRuleBody(node);
        }
        if (node instanceof Model.EnumRule) {
            this.visitRuleBody(node);
        }
        if (node instanceof Model.SeparatedByRule) {
            this.visitRuleBody(node);
        }
    }

    visitCountedRuleElement(node: Model.CountedRuleElement): void {
        this.visitCountableRuleElement(node.countableRuleElement);
        node.versionAnnotations.forEach((x) => {
            this.visitVersionAnnotation(x);
        });
    }

    visitEnumRule(node: Model.EnumRule): void {}

    visitGrammar(node: Model.Grammar): void {
        node.rules.forEach((x) => {
            this.visitRule(x);
        });
        node.prattRules.forEach((x) => {
            this.visitPrattRule(x);
        });
    }

    visitLineComment(node: Model.LineComment): void {}

    visitNegativeLookahead(node: Model.NegativeLookahead): void {
        if (node instanceof Model.CharSet) {
            this.visitCharSet(node);
        }
        if (node instanceof Model.StringElement) {
            this.visitStringElement(node);
        }
    }

    visitPrattOperator(node: Model.PrattOperator): void {
        node.versionAnnotations.forEach((x) => {
            this.visitVersionAnnotation(x);
        });
        this.visitRuleBody(node.body);
    }

    visitPrattPrimary(node: Model.PrattPrimary): void {
        this.visitRuleBody(node.body);
    }

    visitPrattRule(node: Model.PrattRule): void {
        node.versionAnnotations.forEach((x) => {
            this.visitVersionAnnotation(x);
        });
        node.operators.forEach((x) => {
            this.visitPrattOperator(x);
        });
        this.visitPrattPrimary(node.primary);
    }

    visitRule(node: Model.Rule): void {
        node.versionAnnotations.forEach((x) => {
            this.visitVersionAnnotation(x);
        });
        this.visitRuleBody(node.body);
    }

    visitRuleBody(node: Model.RuleBody): void {
        if (node instanceof Model.ChoiceRule) {
            this.visitChoiceRule(node);
        }
        if (node instanceof Model.SequenceRule) {
            this.visitSequenceRule(node);
        }
        if (node instanceof Model.EnumRule) {
            this.visitEnumRule(node);
        }
        if (node instanceof Model.SeparatedByRule) {
            this.visitSeparatedByRule(node);
        }
    }

    visitRuleElement(node: Model.RuleElement): void {
        if (node instanceof Model.CountedRuleElement) {
            this.visitCountedRuleElement(node);
        }
        if (node instanceof Model.NegativeLookahead) {
            this.visitNegativeLookahead(node);
        }
    }

    visitRuleReference(node: Model.RuleReference): void {}

    visitSeparatedByRule(node: Model.SeparatedByRule): void {
        this.visitRuleElement(node.element);
    }

    visitSequenceRule(node: Model.SequenceRule): void {
        node.elements.forEach((x) => {
            this.visitRuleElement(x);
        });
    }

    visitStringElement(node: Model.StringElement): void {}

    visitTrivia(node: Model.Trivia): void {
        if (node instanceof Model.LineComment) {
            this.visitLineComment(node);
        }
        if (node instanceof Model.BlockComment) {
            this.visitBlockComment(node);
        }
        if (node instanceof Model.Whitespace) {
            this.visitWhitespace(node);
        }
    }

    visitVersionAnnotation(node: Model.VersionAnnotation): void {
        this.visitVersionNumber(node.version);
    }

    visitVersionNumber(node: Model.VersionNumber): void {}

    visitWhitespace(node: Model.Whitespace): void {}
}
