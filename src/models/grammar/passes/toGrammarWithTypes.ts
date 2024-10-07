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

        // 1. Check for a terminal

        if (this.isAtomic) {
            this.productMembers = [new ProductMember('value', 'string')];
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

        // 2. Check for an enum - alternatives of strings

        if (input.body instanceof In.AlternativeRules) {
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

    transformAlternativeRules(
        input: In.AlternativeRules
    ): Out.AlternativeRules {
        // Process the type of each AlternativeRule

        if (this.label) {
            const enumMembers = alternativeRulesAsEnum(input);
            if (enumMembers) {
                const definitionName = `${this.ruleName}_${this.label}_${this.definitions.length}`;
                this.definitions.push(
                    new Definition(definitionName, new EnumType(enumMembers))
                );
                this.productMembers.push(
                    new ProductMember(
                        this.label ?? 'value',
                        new NamedTypeReference([definitionName])
                    )
                );
                return new Out.AlternativeRules(
                    input.alternatives.map((a) =>
                        this.transformAlternativeRule(a)
                    )
                );
            }
        }

        return super.transformAlternativeRules(input);
    }

    label?: string;

    transformCountedRuleElement(
        input: In.CountedRuleElement
    ): Out.CountedRuleElement {
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
                    this.productMembers[i].type = new OptionType(
                        this.productMembers[i].type
                    );
                    break;
                default:
                    break;
            }
        }

        return result;
    }

    transformCharSet(input: In.CharSet): Out.CharSet {
        return this.defaultTransformCharSet(input);
    }

    transformRuleReference(input: In.RuleReference): Out.RuleReference {
        const productMember = new ProductMember(
            this.label ?? input.names[input.names.length - 1],
            new NamedTypeReference(input.names)
        );
        this.productMembers.push(productMember);
        return new Out.RuleReference(input.names, productMember);
    }

    transformStringElement(input: In.StringElement): Out.StringElement {
        return this.defaultTransformStringElement(input);
    }

    transformAnyElement(input: In.AnyElement): Out.AnyElement {
        return this.defaultTransformAnyElement(input);
    }
}
