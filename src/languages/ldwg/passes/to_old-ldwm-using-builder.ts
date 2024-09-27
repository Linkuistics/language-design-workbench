import { LDWMBuilder } from '../../ldwm/builder';
import { Model } from '../../ldwm/model';
import {
    AlternativeRule,
    AlternativeRules,
    AnyElement,
    CharSet,
    Count,
    CountedRuleElement,
    Grammar,
    GrammarLanguage,
    IdentifierRule,
    PrattRule,
    Rule,
    RuleAnnotation,
    RuleReference,
    SequenceRule,
    StringElement
} from '../model';
import { TraverseDelegate, Traverser } from '../traverser';
import { alternativeRulesAsEnum } from '../utils';

export class ToLDWM implements TraverseDelegate {
    private rules: Map<string, Rule | PrattRule | IdentifierRule> = new Map();
    private rulesRequiringDiscrimination: Set<string> = new Set();
    private builder: LDWMBuilder;
    private hasLabel: boolean = false;

    constructor() {
        this.builder = new LDWMBuilder('');
    }

    transform(input: GrammarLanguage): Model {
        const grammar = input.grammar;
        this.builder = new LDWMBuilder(grammar.name);

        const collecter = new RulesRequiringDiscriminationCollector(
            this.rulesRequiringDiscrimination
        );
        new Traverser(collecter).visitGrammar(grammar);

        grammar.rules.forEach((rule) => {
            this.rules.set(rule.name, rule);
        });

        try {
            new Traverser(this).visitGrammar(grammar);
            return this.builder.build();
        } catch (error) {
            console.error('Error during LDWM transformation:', error);
            throw error;
        }
    }

    visitGrammar(grammar: Grammar, traverser: Traverser): Grammar {
        traverser.visitGrammarChildren(grammar);
        return grammar;
    }

    visitRule(rule: Rule, traverser: Traverser): Rule {
        this.builder.startNamedType(rule.name);
        if (rule.annotation == RuleAnnotation.Atomic) {
            this.builder.startProductType();
            this.builder.createPrimitiveType('string');
            this.builder.addProductTypeField('value');
        } else {
            traverser.visitRuleChildren(rule);
        }
        this.builder.endNamedType();
        return rule;
    }

    visitPrattRule(rule: PrattRule, traverser: Traverser): PrattRule {
        throw new Error('Pratt rules not implemented');
    }

    visitIdentifierRule(
        rule: IdentifierRule,
        traverser: Traverser
    ): IdentifierRule {
        this.builder.startNamedType(rule.name);
        if (rule.ruleAnnotation == RuleAnnotation.Atomic) {
            this.builder.startProductType();
            this.builder.createPrimitiveType('string');
            this.builder.addProductTypeField('value');
        } else {
            traverser.visitIdentifierRuleChildren(rule);
        }
        this.builder.endNamedType();
        return rule;
    }

    visitSequenceRule(rule: SequenceRule, traverser: Traverser): SequenceRule {
        this.builder.startProductType();
        traverser.visitSequenceRuleChildren(rule);
        return rule;
    }

    visitAlternativeRules(
        rules: AlternativeRules,
        traverser: Traverser
    ): AlternativeRules {
        if (rules.alternatives.length === 0) {
            this.builder.createVoidType();
            return rules;
        }

        let enumMembers = alternativeRulesAsEnum(rules);
        if (enumMembers) {
            this.builder.startEnumType();
            for (const member of enumMembers) {
                this.builder.addEnumMember(member);
            }
        } else {
            this.builder.startSumType();
            traverser.visitAlternativeRulesChildren(rules);
        }
        return rules;
    }

    visitAlternativeRule(
        rule: AlternativeRule,
        traverser: Traverser
    ): AlternativeRule {
        const depth = this.builder.depth();
        traverser.visitAlternativeRuleChildren(rule);
        while (depth !== this.builder.depth()) {
            this.builder.addSumTypeMember();
        }
        return rule;
    }

    visitCountedRuleElement(
        element: CountedRuleElement,
        traverser: Traverser
    ): CountedRuleElement {
        const depth = this.builder.depth();
        const oldHasLabel = this.hasLabel;
        this.hasLabel = element.label !== undefined;
        traverser.visitCountedRuleElementChildren(element);
        this.hasLabel = oldHasLabel;

        while (depth !== this.builder.depth()) {
            if (
                element.count == Count.ZeroOrMore ||
                element.count == Count.OneOrMore
            ) {
                this.builder.createArrayType();
            } else if (element.count == Count.Optional) {
                this.builder.createOptionalType();
            }
            this.builder.addProductTypeField(element.label ?? '_');
        }

        return element;
    }

    visitRuleReference(
        reference: RuleReference,
        traverser: Traverser
    ): RuleReference {
        let defaultName = reference.names[reference.names.length - 1];
        this.builder.createNamedTypeReference(defaultName);
        return reference;
    }

    visitAnyElement(element: AnyElement, traverser: Traverser): AnyElement {
        if (this.hasLabel) {
            this.builder.createPrimitiveType('string');
        }
        return element;
    }

    visitStringElement(
        element: StringElement,
        traverser: Traverser
    ): StringElement {
        if (this.hasLabel) {
            this.builder.createPrimitiveType('boolean');
        }
        return element;
    }

    visitCharSet(charSet: CharSet, traverser: Traverser): CharSet {
        if (this.hasLabel) {
            this.builder.createPrimitiveType('string');
        }
        return charSet;
    }
}

class RulesRequiringDiscriminationCollector implements TraverseDelegate {
    constructor(public rulesRequiringDiscrimination: Set<string>) {}

    visitAlternativeRule(
        rule: AlternativeRule,
        traverser: Traverser
    ): AlternativeRule {
        for (const alternative of rule.sequenceRule.elements) {
            const fieldCollecter = new FieldCollector();
            new Traverser(fieldCollecter).visitRuleElement(alternative);
            if (fieldCollecter.fields.length !== 1) continue;
            const cre = fieldCollecter.fields[0].countableRuleElement;
            if (cre instanceof RuleReference) {
                this.rulesRequiringDiscrimination.add(cre.names[0]);
            }
        }
        return rule;
    }
}

class FieldCollector implements TraverseDelegate {
    constructor(public fields: CountedRuleElement[] = []) {}

    visitCountedRuleElement(
        element: CountedRuleElement,
        traverser: Traverser
    ): CountedRuleElement {
        if (element.label) {
            this.fields.push(element);
            return element;
        }
        const cre = element.countableRuleElement;
        if (
            cre instanceof AnyElement ||
            cre instanceof StringElement ||
            cre instanceof CharSet
        ) {
            return element;
        }
        if (cre instanceof RuleReference) {
            this.fields.push(element);
        }
        traverser.visitCountedRuleElementChildren(element);
        return element;
    }
}
