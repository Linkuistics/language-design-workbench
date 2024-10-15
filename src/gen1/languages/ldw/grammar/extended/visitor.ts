// Generated on 2024-10-15T13:20:34.149Z by Bach.local at /Users/antony/Development/Linkuistics/language-design-workbench

import * as Model from './model';

export class Visitor {
    visitGrammar(node: Model.Grammar): void {
        node.rules.forEach((x) => {
            this.visitRule(x);
        });
        node.prattRules.forEach((x) => {
            this.visitPrattRule(x);
        });
    }

    visitRule(node: Model.Rule): void {
        if (node.annotation != undefined) {
        }
        node.versionAnnotations.forEach((x) => {
            this.visitVersionAnnotation(x);
        });
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

    visitPrattOperator(node: Model.PrattOperator): void {
        node.versionAnnotations.forEach((x) => {
            this.visitVersionAnnotation(x);
        });
        this.visitRuleBody(node.body);
    }

    visitPrattPrimary(node: Model.PrattPrimary): void {
        this.visitRuleBody(node.body);
    }

    visitVersionAnnotation(node: Model.VersionAnnotation): void {
        this.visitVersionNumber(node.version);
    }

    visitVersionNumber(node: Model.VersionNumber): void {}

    visitRuleBody(node: Model.RuleBody): void {
        if (node instanceof Model.ChoiceRule) {
            this.visitChoiceRule(node);
        } else if (node instanceof Model.SequenceRule) {
            this.visitSequenceRule(node);
        } else if (node instanceof Model.EnumRule) {
            this.visitEnumRule(node);
        } else if (node instanceof Model.SeparatedByRule) {
            this.visitSeparatedByRule(node);
        }
    }

    visitChoiceRule(node: Model.ChoiceRule): void {
        node.choices.forEach((x) => {
            this.visitSequenceRule(x);
        });
    }

    visitSequenceRule(node: Model.SequenceRule): void {
        node.elements.forEach((x) => {
            this.visitRuleElement(x);
        });
    }

    visitRuleElement(node: Model.RuleElement): void {
        if (node instanceof Model.CountedRuleElement) {
            this.visitCountedRuleElement(node);
        } else if (node instanceof Model.NegativeLookahead) {
            this.visitNegativeLookahead(node);
        }
    }

    visitCountedRuleElement(node: Model.CountedRuleElement): void {
        if (node.label != undefined) {
        }
        this.visitCountableRuleElement(node.countableRuleElement);
        if (node.count != undefined) {
        }
        node.versionAnnotations.forEach((x) => {
            this.visitVersionAnnotation(x);
        });
    }

    visitCountableRuleElement(node: Model.CountableRuleElement): void {
        if (node instanceof Model.RuleReference) {
            this.visitRuleReference(node);
        } else if (node instanceof Model.StringElement) {
            this.visitStringElement(node);
        } else if (node instanceof Model.CharSet) {
            this.visitCharSet(node);
        } else if (node instanceof Model.AnyElement) {
            this.visitAnyElement(node);
        } else if (node instanceof Model.ChoiceRule) {
            this.visitRuleBody(node);
        } else if (node instanceof Model.SequenceRule) {
            this.visitRuleBody(node);
        } else if (node instanceof Model.EnumRule) {
            this.visitRuleBody(node);
        } else if (node instanceof Model.SeparatedByRule) {
            this.visitRuleBody(node);
        }
    }

    visitRuleReference(node: Model.RuleReference): void {}

    visitStringElement(node: Model.StringElement): void {}

    visitCharSet(node: Model.CharSet): void {}

    visitAnyElement(node: Model.AnyElement): void {}

    visitNegativeLookahead(node: Model.NegativeLookahead): void {
        if (node.content instanceof Model.CharSet) {
            this.visitCharSet(node.content);
        } else if (node.content instanceof Model.StringElement) {
            this.visitStringElement(node.content);
        }
    }

    visitTrivia(node: Model.Trivia): void {
        if (node instanceof Model.LineComment) {
            this.visitLineComment(node);
        } else if (node instanceof Model.BlockComment) {
            this.visitBlockComment(node);
        } else if (node instanceof Model.Whitespace) {
            this.visitWhitespace(node);
        }
    }

    visitLineComment(node: Model.LineComment): void {}

    visitBlockComment(node: Model.BlockComment): void {}

    visitWhitespace(node: Model.Whitespace): void {}

    visitEnumRule(node: Model.EnumRule): void {}

    visitSeparatedByRule(node: Model.SeparatedByRule): void {
        this.visitRuleElement(node.element);
    }
}
