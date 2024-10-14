import * as In from '../../grammar/extended/model';
import * as Out from './model';

export class Transformer {
    transformGrammar(input: In.Grammar): Out.Grammar {
        return new Out.Grammar({
            names: input.names,
            rules: input.rules.map((r) => this.transformRule(r)),
            prattRules: input.prattRules.map((r) => this.transformPrattRule(r)),
            definitions: []
        });
    }

    transformRuleBody(input: In.RuleBody): Out.RuleBody {
        if (input instanceof In.SequenceRule) {
            return this.transformSequenceRule(input);
        } else if (input instanceof In.ChoiceRule) {
            return this.transformChoiceRule(input);
        } else if (input instanceof In.EnumRule) {
            return this.transformEnumRule(input);
        } else {
            return this.transformSeparatedByRule(input);
        }
    }

    transformCountableRuleElement(input: In.CountableRuleElement): Out.CountableRuleElement {
        if (input instanceof In.RuleReference) {
            return this.transformRuleReference(input);
        } else if (input instanceof In.StringElement) {
            return this.transformStringElement(input);
        } else if (input instanceof In.CharSet) {
            return this.transformCharSet(input);
        } else if (input instanceof In.AnyElement) {
            return this.transformAnyElement(input);
        } else {
            return this.transformRuleBody(input);
        }
    }

    transformRuleElement(input: In.RuleElement): Out.RuleElement {
        if (input instanceof In.CountedRuleElement) {
            return this.transformCountedRuleElement(input);
        } else {
            return this.transformNegativeLookahead(input);
        }
    }

    transformRule(input: In.Rule): Out.Rule {
        throw new Error('Automatic transformation not possible');
    }

    transformPrattRule(input: In.PrattRule): Out.PrattRule {
        return new Out.PrattRule({
            name: input.name,
            operators: input.operators.map((o) => this.transformPrattOperator(o)),
            primary: this.transformPrattPrimary(input.primary),
            versionAnnotations: input.versionAnnotations
        });
    }

    transformPrattOperator(input: In.PrattOperator): Out.PrattOperator {
        return new Out.PrattOperator({
            type: input.type,
            name: input.name,
            body: this.transformRuleBody(input.body),
            versionAnnotations: input.versionAnnotations
        });
    }

    transformPrattPrimary(input: In.PrattPrimary): Out.PrattPrimary {
        return new Out.PrattPrimary({ name: input.name, body: this.transformRuleBody(input.body) });
    }

    transformSequenceRule(input: In.SequenceRule): Out.SequenceRule {
        return new Out.SequenceRule({ elements: input.elements.map((e) => this.transformRuleElement(e)) });
    }

    transformChoiceRule(input: In.ChoiceRule): Out.ChoiceRule {
        return new Out.ChoiceRule({ choices: input.choices.map((a) => this.transformSequenceRule(a)) });
    }

    transformEnumRule(input: In.EnumRule): Out.EnumRule {
        return new Out.EnumRule({ members: input.members });
    }

    transformSeparatedByRule(input: In.SeparatedByRule): Out.SeparatedByRule {
        return new Out.SeparatedByRule({
            element: this.transformRuleElement(input.element),
            separator: input.separator,
            minCount: input.minCount
        });
    }

    transformCountedRuleElement(input: In.CountedRuleElement): Out.CountedRuleElement {
        return new Out.CountedRuleElement({
            countableRuleElement: this.transformCountableRuleElement(input.countableRuleElement),
            count: input.count,
            versionAnnotations: input.versionAnnotations
        });
    }

    transformCharSet(input: In.CharSet): Out.CharSet {
        return new Out.CharSet({ negated: input.negated, startChars: input.startChars, endChars: input.endChars });
    }

    transformNegativeLookahead(input: In.NegativeLookahead): Out.NegativeLookahead {
        return new Out.NegativeLookahead({ content: this.transformNegativeLookaheadContent(input.content) });
    }

    transformNegativeLookaheadContent(input: In.CharSet | In.StringElement): Out.CharSet | Out.StringElement {
        if (input instanceof In.CharSet) {
            return this.transformCharSet(input);
        } else {
            return this.transformStringElement(input);
        }
    }

    transformRuleReference(input: In.RuleReference): Out.RuleReference {
        return new Out.RuleReference({ names: input.names });
    }

    transformStringElement(input: In.StringElement): Out.StringElement {
        return new Out.StringElement({ value: input.value });
    }

    transformAnyElement(input: In.AnyElement): Out.AnyElement {
        return new Out.AnyElement({});
    }
}
