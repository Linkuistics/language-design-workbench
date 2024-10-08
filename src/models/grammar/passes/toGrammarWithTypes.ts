import * as In from '../model';
import * as Out from '../../grammarWithTypes/model';
import { Transformer } from '../../grammarWithTypes/transformer';
import {
    Definition,
    EnumType,
    NamedTypeReference,
    OptionType,
    ProductMember,
    ProductType,
    SequenceType
} from '../../model/model';
import { alternativeRulesAsEnum } from '../utils';
import assert from 'assert';

export class ToGrammarWithTypes extends Transformer {
    transform(input: In.Grammar): Out.Grammar {
        return this.transformGrammar(input);
    }

    transformGrammar(input: In.Grammar): Out.Grammar {
        // TODO: collect additional type definitions
        const output = this.defaultTransformGrammar(input);
        output.definitions = this.definitions;
        return output;
    }

    definitions: Definition[] = [];
    productMembers: ProductMember[] = [];
    ruleName: string = '';
    isAtomic: boolean = false;
    isNoSkip: boolean = false;

    transformRule(input: In.Rule): Out.Rule {
        this.isAtomic = input.annotation == In.RuleAnnotation.Atomic;
        this.isNoSkip =
            this.isAtomic || input.annotation == In.RuleAnnotation.NoSkip;
        this.ruleName = input.name;
        this.productMembers = [];

        // 1. Check for a terminal i.e. an atomic

        if (this.isAtomic) {
            const body = this.transformRuleBody(input.body);
            // This throws away any returned substructure, but each step
            // should check `this.isAtomic` before doing any transformation
            this.productMembers = [new ProductMember('value', 'string')];
            return new Out.Rule(
                input.name,
                body,
                this.isNoSkip,
                this.isAtomic,
                input.versionAnnotations,
                new ProductType(this.productMembers)
            );
        }

        // TODO: can we just hoist from the result of processing the children

        // 2. Check for an enum - alternatives of strings

        if (input.body instanceof In.ChoiceRule) {
            const enumMembers = alternativeRulesAsEnum(input.body);
            if (enumMembers) {
                const body = this.transformRuleBody(input.body);
                return new Out.Rule(
                    input.name,
                    body,
                    this.isNoSkip,
                    this.isAtomic,
                    input.versionAnnotations,
                    new EnumType(enumMembers)
                );
            }
        }

        const body = this.transformRuleBody(input.body);
        return new Out.Rule(
            input.name,
            body,
            this.isNoSkip,
            this.isAtomic,
            input.versionAnnotations,
            new ProductType(this.productMembers)
        );
    }

    transformChoiceRule(input: In.ChoiceRule): Out.ChoiceRule {
        assert(
            this.label === undefined,
            `Choice rule should not have a label (${this.label}) by the time this pass is applied`
        );

        // Process each choice, and then ...

        // Each choice that produces more than one field is an anonymous ProductType

        // If we have a label, we produce a SumType

        // Merge the fields with the same name, into a SumType.

        // All non-array fields become optional

        return super.transformChoiceRule(input);
    }

    transformSequenceRule(input: In.SequenceRule): Out.SequenceRule {
        assert(
            this.label === undefined,
            `Sequence rule should not have a label (${this.label}) by the time this pass is applied`
        );

        return super.transformSequenceRule(input);
    }

    label?: string;

    transformCountedRuleElement(
        input: In.CountedRuleElement
    ): Out.CountedRuleElement {
        if (this.isAtomic) {
            return super.transformCountedRuleElement(input);
        }

        const productMemberLength = this.productMembers.length;
        const oldLabel = this.label;
        this.label = input.label ?? this.label;
        const result = super.transformCountedRuleElement(input);
        this.label = oldLabel;
        for (let i = productMemberLength; i < this.productMembers.length; i++) {
            switch (input.count) {
                case In.Count.ZeroOrMore:
                case In.Count.OneOrMore:
                    this.productMembers[i].type = new SequenceType(
                        this.productMembers[i].type
                    );
                    break;
                case In.Count.Optional:
                    if (
                        this.productMembers[i].type !== 'boolean' &&
                        !(this.productMembers[i].type instanceof SequenceType)
                    ) {
                        this.productMembers[i].type = new OptionType(
                            this.productMembers[i].type
                        );
                    }
                    break;
                default:
                    break;
            }
        }

        return result;
    }

    transformCharSet(input: In.CharSet): Out.CharSet {
        if (!this.isAtomic && this.label) {
            this.productMembers.push(new ProductMember(this.label, 'string'));
        }

        return this.defaultTransformCharSet(input);
    }

    transformRuleReference(input: In.RuleReference): Out.RuleReference {
        if (!this.isAtomic) {
            const productMember = new ProductMember(
                this.label ?? input.names[input.names.length - 1],
                new NamedTypeReference(input.names)
            );
            this.productMembers.push(productMember);
            return new Out.RuleReference(input.names, productMember);
        }

        return this.defaultTransformRuleReference(input);
    }

    transformStringElement(input: In.StringElement): Out.StringElement {
        if (!this.isAtomic && this.label) {
            this.productMembers.push(new ProductMember(this.label, 'boolean'));
        }

        return this.defaultTransformStringElement(input);
    }

    transformAnyElement(input: In.AnyElement): Out.AnyElement {
        if (!this.isAtomic && this.label) {
            this.productMembers.push(new ProductMember(this.label, 'boolean'));
        }

        return this.defaultTransformAnyElement(input);
    }
}
