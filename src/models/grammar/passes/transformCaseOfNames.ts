import { camelCase, pascalCase } from 'literal-case';
import {
    AlternativeRules,
    CountedRuleElement,
    Grammar,
    IdentifierRule,
    Rule,
    RuleReference
} from '../model';
import { TraverseDelegate, Traverser } from '../traverser';

export class TransformCaseOfNames implements TraverseDelegate {
    transform(input: Grammar): Grammar {
        return new Traverser(this).visitGrammar(input);
    }

    visitRule(rule: Rule, traverser: Traverser): Rule {
        rule.name = pascalCase(rule.name);
        traverser.visitRuleChildren(rule);
        return rule;
    }

    visitIdentifierRule(
        rule: IdentifierRule,
        traverser: Traverser
    ): IdentifierRule {
        rule.name = pascalCase(rule.name);
        traverser.visitIdentifierRuleChildren(rule);
        return rule;
    }

    visitAlternativeRules(
        rules: AlternativeRules,
        traverser: Traverser
    ): AlternativeRules {
        traverser.visitAlternativeRulesChildren(rules);
        return rules;
    }

    visitCountedRuleElement(
        element: CountedRuleElement,
        traverser: Traverser
    ): CountedRuleElement {
        if (element.label) {
            element.label = camelCase(element.label);
        }
        traverser.visitCountedRuleElementChildren(element);
        return element;
    }

    visitRuleReference(
        ruleReference: RuleReference,
        traverser: Traverser
    ): RuleReference {
        ruleReference.names[ruleReference.names.length - 1] = pascalCase(
            ruleReference.names[ruleReference.names.length - 1]
        );
        return ruleReference;
    }
}
