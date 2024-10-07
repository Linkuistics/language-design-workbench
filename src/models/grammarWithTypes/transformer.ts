import * as In from '../../models/grammar/model';
import * as Out from './model';
export {
    CharSetChar,
    Count,
    Label,
    Name,
    PrattOperatorType,
    VersionAnnotation,
    VersionAnnotationType,
    VersionNumber,
    VersionSegment
} from '../../models/grammar/model';

export abstract class Transformer {
    abstract transformGrammar(input: In.Grammar): Out.Grammar;
    defaultTransformGrammar(input: In.Grammar): Out.Grammar {
        return new Out.Grammar(
            input.name,
            input.rules.map((r) => this.transformGrammarRule(r)),
            [] // New field
        );
    }

    transformGrammarRule(
        input: In.Rule | In.PrattRule
    ): Out.Rule | Out.PrattRule {
        if (input instanceof In.Rule) {
            return this.transformRule(input);
        } else {
            // if (input instanceof In.PrattRule) {
            return this.transformPrattRule(input);
        }
    }

    transformRuleBody(input: In.RuleBody): Out.RuleBody {
        if (input instanceof In.SequenceRule) {
            return this.transformSequenceRule(input);
        } else {
            // if (input instanceof In.AlternativeRules) {
            return this.transformAlternativeRules(input);
        }
    }

    transformCountableRuleElement(
        input: In.CountableRuleElement
    ): Out.CountableRuleElement {
        if (input instanceof In.RuleReference) {
            return this.transformRuleReference(input);
        } else if (input instanceof In.StringElement) {
            return this.transformStringElement(input);
        } else if (input instanceof In.CharSet) {
            return this.transformCharSet(input);
        } else if (input instanceof In.AnyElement) {
            return this.transformAnyElement(input);
        } else if (input instanceof In.SequenceRule) {
            return this.transformSequenceRule(input);
        } else if (input instanceof In.AlternativeRules) {
            return this.transformAlternativeRules(input);
        } else {
            throw new Error('Unexpected countable rule element type');
        }
    }

    transformRuleElement(input: In.RuleElement): Out.RuleElement {
        if (input instanceof In.CountedRuleElement) {
            return this.transformCountedRuleElement(input);
        } else {
            // if (input instanceof In.NegativeLookahead) {
            return this.transformNegativeLookahead(input);
        }
    }

    abstract transformRule(input: In.Rule): Out.Rule;
    // defaultTransformRule(input: In.Rule): Rule {
    //     return new Rule(
    //         input.name,
    //         this.transformRuleBody(input.body),
    //         false, // New field
    //         false, // New field
    //         input.versionAnnotations,
    //         ??? // New field
    //     );
    // }

    transformPrattRule(input: In.PrattRule): Out.PrattRule {
        return new Out.PrattRule(
            input.name,
            input.operators.map((o) => this.transformPrattOperator(o)),
            this.transformPrattPrimary(input.primary),
            input.versionAnnotations
        );
    }

    transformPrattOperator(input: In.PrattOperator): Out.PrattOperator {
        return new Out.PrattOperator(
            input.type,
            input.name,
            this.transformRuleBody(input.body),
            input.versionAnnotations
        );
    }

    transformPrattPrimary(input: In.PrattPrimary): Out.PrattPrimary {
        return new Out.PrattPrimary(
            input.name,
            this.transformRuleBody(input.body)
        );
    }

    transformSequenceRule(input: In.SequenceRule): Out.SequenceRule {
        return new Out.SequenceRule(
            input.elements.map((e) => this.transformRuleElement(e))
        );
    }

    transformAlternativeRules(
        input: In.AlternativeRules
    ): Out.AlternativeRules {
        return new Out.AlternativeRules(
            input.alternatives.map((a) => this.transformAlternativeRule(a))
        );
    }

    transformAlternativeRule(input: In.AlternativeRule): Out.AlternativeRule {
        return new Out.AlternativeRule(
            this.transformSequenceRule(input.sequenceRule),
            input.versionAnnotations
        );
    }

    transformCountedRuleElement(
        input: In.CountedRuleElement
    ): Out.CountedRuleElement {
        return new Out.CountedRuleElement(
            this.transformCountableRuleElement(input.countableRuleElement),
            input.count,
            input.versionAnnotations
        );
    }

    abstract transformCharSet(input: In.CharSet): Out.CharSet;
    defaultTransformCharSet(input: In.CharSet): Out.CharSet {
        return new Out.CharSet(
            input.negated,
            input.ranges,
            undefined // New field
        );
    }

    transformNegativeLookahead(
        input: In.NegativeLookahead
    ): Out.NegativeLookahead {
        return new Out.NegativeLookahead(
            this.transformNegativeLookaheadContent(input.content)
        );
    }

    transformNegativeLookaheadContent(
        input: In.CharSet | In.StringElement
    ): Out.CharSet | Out.StringElement {
        if (input instanceof In.CharSet) {
            return this.transformCharSet(input);
        } else if (input instanceof In.StringElement) {
            return this.transformStringElement(input);
        } else {
            throw new Error('Unexpected negative lookahead content type');
        }
    }

    abstract transformRuleReference(input: In.RuleReference): Out.RuleReference;
    // defaultTransformRuleReference(input: In.RuleReference): RuleReference {
    //     return new RuleReference(
    //         input.names,
    //         ??? // New field
    //     );
    // }

    abstract transformStringElement(input: In.StringElement): Out.StringElement;
    defaultTransformStringElement(input: In.StringElement): Out.StringElement {
        return new Out.StringElement(
            input.value,
            undefined // New field
        );
    }

    abstract transformAnyElement(input: In.AnyElement): Out.AnyElement;
    defaultTransformAnyElement(input: In.AnyElement): Out.AnyElement {
        return new Out.AnyElement(
            undefined // New field
        );
    }
}
