import {
    Definition,
    Model,
    NamedTypeReference,
    OptionType,
    ProductMember,
    ProductType,
    SequenceType
} from '../../ldwm/new-model';
import {
    AlternativeRule,
    AlternativeRules,
    AnyElement,
    CharSet,
    Count,
    CountedRuleElement,
    GrammarLanguage,
    Rule,
    RuleReference,
    StringElement
} from '../model';
import { TraverseDelegate, Traverser } from '../traverser';

export class ToLDWM implements TraverseDelegate {
    private definitions: Definition[] = [];

    transform(input: GrammarLanguage): Model {
        new Traverser(this).visitGrammar(input.grammar);
        const output = new Model(
            input.grammar.name,
            undefined,
            this.definitions
        );
        return output;
    }

    visitRule(rule: Rule, traverser: Traverser): Rule {
        // Check for an enum type
        const fieldCollector = new FieldCollector();
        new Traverser(fieldCollector).visitRule(rule);
        // check for a sum type
        // merge fields with the same name.
        // collapse identical types into a single array field
        // collapse option<X>/array<X>/X into array<X>
        // collapse non-identical types into sum type
        // collapse option<X>/array<Y>/Z into array<X | Y | Z>
        // collapse option<X>/option<Y>/Z into array<X | Y | Z> - both options may occur!
        // collapse X/Y into array<X | Y>
        this.definitions.push(
            new Definition(rule.name, new ProductType(fieldCollector.members))
        );
        return rule;
    }
}

// Collects the fields contributed by a model element
class FieldCollector implements TraverseDelegate {
    public members: ProductMember[] = [];

    visitCountedRuleElement(
        element: CountedRuleElement,
        traverser: Traverser
    ): CountedRuleElement {
        let members: ProductMember[] = [];
        if (element.countableRuleElement instanceof RuleReference) {
            members.push({
                name: element.label ?? element.countableRuleElement.names[0],
                type: new NamedTypeReference(element.countableRuleElement.names)
            });
        } else if (element.label) {
            if (element.countableRuleElement instanceof CharSet) {
                members.push({
                    name: element.label,
                    type: 'string'
                });
            } else if (element instanceof AnyElement) {
                members.push({
                    name: element.label,
                    type: 'string'
                });
            } else if (element instanceof StringElement) {
                members.push({
                    name: element.label,
                    type: 'boolean'
                });
            } else {
                const fieldCollector = new FieldCollector();
                new Traverser(fieldCollector).visitCountableRuleElement(
                    element.countableRuleElement
                );
                for (const member of fieldCollector.members)
                    members.push(member);
            }
        }

        for (const field of members) {
            switch (element.count) {
                case Count.ZeroOrMore:
                case Count.OneOrMore:
                    if (field.type instanceof OptionType) {
                        field.type = new SequenceType(field.type.type);
                    } else if (field.type instanceof SequenceType) {
                        // no change
                    } else {
                        field.type = new SequenceType(field.type);
                    }
                    break;
                case Count.Optional:
                    if (
                        field.type == 'boolean' ||
                        field.type instanceof OptionType ||
                        field.type instanceof SequenceType
                    ) {
                        // no change
                    } else {
                        field.type = new OptionType(field.type);
                    }
                    break;
                default:
                    break;
            }
        }

        for (const member of members) this.members.push(member);

        return element;
    }

    // visitAlternativeRules(
    //     rules: AlternativeRules,
    //     traverser: Traverser
    // ): AlternativeRules {
    //     // make a sum type of all alternatives
    //     // merge identical alternatives
    //     // you may end up with a single field with the union as the type
    //     return rules;
    // }
}
