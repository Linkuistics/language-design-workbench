import pluralize from 'pluralize';
import * as In from '../../grammarExtended/model';
import {
    EnumType,
    NamedTypeReference,
    OptionType,
    ProductMember,
    ProductType,
    SequenceType,
    SumType
} from '../../model/model';
import { Traverser as ModelTraverser } from '../../model/traverser';
import { baseType, typesAreEqual } from '../../model/util';
import * as Out from '../model';
import { Transformer } from '../transformer';
import { TraverseDelegate, Traverser } from '../traverser';

export class GrammarWithTypesFromGrammarExtended extends Transformer {
    transform(input: In.Grammar): Out.Grammar {
        return new TransformToGrammarWithTypes().transformGrammar(input);
    }
}

class TransformToGrammarWithTypes extends Transformer {
    transformGrammar(input: In.Grammar): Out.Grammar {
        const grammar = super.transformGrammar(input);

        // Any rule whose type is a ProductType with a single field, that is not referenced
        // from a SumType, can have its type Hoisted

        const sumMembers = new Set<string>();
        const traverser = new ModelTraverser({
            visitSumType(type: SumType, traverser: ModelTraverser) {
                for (const member of type.members) {
                    if (member instanceof NamedTypeReference) {
                        sumMembers.add(member.names[member.names.length - 1]);
                    }
                }
                traverser.visitSumTypeContent(type);
            }
        });

        for (const rule of grammar.rules) {
            traverser.visitType(rule.type);
        }

        for (const rule of grammar.rules) {
            if (!sumMembers.has(rule.name) && rule.type instanceof ProductType && rule.type.members.length === 1) {
                rule.type = rule.type.members[0].type;
            }
        }

        return grammar;
    }

    transformRule(input: In.Rule): Out.Rule {
        if (input.annotation === In.RuleAnnotation.Atomic) {
            // Default Transformer will just map the types
            const body = new Transformer().transformRuleBody(input.body);
            return new Out.Rule(
                input.name,
                body,
                input.annotation,
                input.versionAnnotations,
                new ProductType([new ProductMember('value', 'string')])
            );
        }

        const body = this.transformRuleBody(input.body);

        // Propagate multiplicity down through the tree
        const counts: Out.Count[] = [];
        new Traverser({
            visitField(field: Out.Field) {
                if (field.type) {
                    for (let i = counts.length - 1; i >= 0; i--) {
                        if (counts[i] === Out.Count.Optional) {
                            if (
                                field.type === 'boolean' ||
                                field.type instanceof SequenceType ||
                                field.type instanceof OptionType
                            ) {
                                // No change
                            } else {
                                field.type = new OptionType(field.type);
                            }
                        } else {
                            field.type = new SequenceType(field.type);
                        }
                    }
                }
            },
            visitSeparatedByRule(rule: Out.SeparatedByRule, traverser: Traverser) {
                counts.push(Out.Count.ZeroOrMore);
                traverser.visitSeparatedByRuleContent(rule);
                counts.pop();
            },
            visitCountedRuleElement(element: Out.CountedRuleElement, traverser: Traverser) {
                if (element.count) counts.push(element.count);
                traverser.visitCountedRuleElementContent(element);
                if (element.count) counts.pop();
            }
        }).visitRuleBody(body);

        const fields: Out.Field[] = [];
        new Traverser(new CollectFields(fields)).visitRuleBody(body);

        /*
            Merge fields that have the same name.

            if they have equal base types
                replace the type with a SequenceType of that baseType
            else 
               replace the type with a SumType of all the types.

            // TODO: (maybe) if they are all OptionTypes, make a SequenceType of the SumType of the base types

            Do the merging by changing the types of all those fields that have
            the same name, so that all other references to the Fields see the
            change
        */

        let fieldsGroupedByName = fields.reduce(
            (acc, f) => {
                (acc[f.name ?? ''] = acc[f.name ?? ''] || []).push(f);
                return acc;
            },
            {} as Record<string, Out.Field[]>
        );
        const duplicatedFields = Object.values(fieldsGroupedByName).filter((v) => v.length > 1);

        for (const fields of duplicatedFields) {
            const theBaseType = baseType(fields[0].type);
            let theNewType;
            if (fields.every((f) => typesAreEqual(baseType(f.type), theBaseType))) {
                theNewType = new SequenceType(theBaseType);
            } else if (fields.every((f) => f instanceof SequenceType)) {
                theNewType = new SequenceType(new SumType(fields.map((f) => f.type)));
            } else {
                theNewType = new SumType(fields.map((f) => f.type));
            }
            for (const field of fields) {
                field.type = theNewType;
            }
        }

        let uniqueFields = Object.values(fieldsGroupedByName).map((fields) => fields[0]);

        let ruleType = undefined;

        if (uniqueFields.length === 1) {
            let field = uniqueFields[0];
            if (field.name === undefined || field.name === '_') {
                ruleType = field.type;
            } else if (!field.isExplicit && field.type instanceof SumType) {
                ruleType = field.type;
            }
        }

        if (ruleType === undefined) {
            ruleType = new ProductType(
                uniqueFields
                    .filter((f) => f.name != undefined)
                    .map((f) => {
                        const name = f.type instanceof SequenceType ? pluralize(f.name!) : f.name!;
                        return new ProductMember(name, f.type);
                    })
            );
        }

        return new Out.Rule(input.name, body, input.annotation, input.versionAnnotations, ruleType);
    }

    explicitFieldName: string | undefined;
    forceFieldName: boolean = false;

    transformCountedRuleElement(input: In.CountedRuleElement): Out.CountedRuleElement {
        const oldExplicitFieldName = this.explicitFieldName;
        const oldForceFieldName = this.forceFieldName;

        if (input.label) {
            this.forceFieldName = true;
            this.explicitFieldName = input.label;
        }

        const result = super.transformCountedRuleElement(input);

        this.explicitFieldName = oldExplicitFieldName;
        this.forceFieldName = oldForceFieldName;

        return result;
    }

    transformRuleBody(input: In.RuleBody): Out.RuleBody {
        const oldForceFieldName = this.forceFieldName;
        this.forceFieldName = false;

        const result = super.transformRuleBody(input);

        this.forceFieldName = oldForceFieldName;

        return result;
    }

    transformEnumRule(input: In.EnumRule): Out.EnumRule {
        return new Out.EnumRule(
            input.members,
            this.forceFieldName
                ? new Out.Field(new EnumType(input.members.map((m) => m.name)), this.explicitFieldName, true)
                : new Out.Field(new EnumType(input.members.map((m) => m.name)))
        );
    }

    transformCharSet(input: In.CharSet): Out.CharSet {
        return new Out.CharSet(
            input.negated,
            input.ranges,
            this.forceFieldName ? new Out.Field('string', this.explicitFieldName, true) : undefined
        );
    }

    transformRuleReference(input: In.RuleReference): Out.RuleReference {
        return new Out.RuleReference(
            input.names,
            new Out.Field(
                new NamedTypeReference(input.names),
                this.explicitFieldName ?? input.names[input.names.length - 1],
                this.explicitFieldName !== undefined
            )
        );
    }

    transformStringElement(input: In.StringElement): Out.StringElement {
        return new Out.StringElement(
            input.value,
            this.forceFieldName ? new Out.Field('boolean', this.explicitFieldName, true) : undefined
        );
    }

    transformAnyElement(input: In.AnyElement): Out.AnyElement {
        return new Out.AnyElement(
            this.forceFieldName ? new Out.Field('string', this.explicitFieldName, true) : undefined
        );
    }
}

class CollectFields implements TraverseDelegate {
    constructor(public fields: Out.Field[] = []) {}

    visitChoiceRule(rule: Out.ChoiceRule) {
        const choicesFields = rule.choices.map((choice) => {
            const collector = new CollectFields();
            new Traverser(collector).visitSequenceRule(choice);
            return collector.fields;
        });

        const firstField = choicesFields[0][0];
        if (
            choicesFields.every(
                (fields) =>
                    fields.length === 1 && fields[0].name === firstField.name && fields[0].type instanceof SequenceType
            )
        ) {
            // convert F = seq<A> | F = seq<B> to F = seq<A | B>
            const newType = new SequenceType(new SumType(choicesFields.map((fields) => baseType(fields[0].type))));
            for (const fields of choicesFields) {
                fields[0].type = newType;
            }
            this.fields.push(firstField);
        } else {
            for (const field of choicesFields.flat()) {
                this.fields.push(field);
            }
        }
    }

    visitField(field: Out.Field) {
        this.fields.push(field);
    }
}
