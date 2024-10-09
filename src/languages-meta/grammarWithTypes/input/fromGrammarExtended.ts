import pluralize from 'pluralize';
import * as In from '../../grammarExtended/model';
import {
    EnumType,
    NamedTypeReference,
    OptionType,
    ProductMember,
    ProductType,
    SequenceType,
    SumType,
    Type
} from '../../model/model';
import { typesAreEqual } from '../../model/util';
import * as Out from '../model';
import { Transformer } from '../transformer';
import { TraverseDelegate, Traverser } from '../traverser';
import { TraverseDelegate as ModelTraverseDelegate, Traverser as ModelTraverser } from '../../model/traverser';
import { pascalCase } from 'literal-case';

export class GrammarWithTypesFromGrammarExtended extends Transformer {
    transform(input: In.Grammar): Out.Grammar {
        const grammar = new TransformToGrammarWithTypes().transformGrammar(input);

        // Any rule whose type is a ProductType with a single field, that is not referenced
        // from a SumType, can have its type Hoisted

        const sumMembers = new Set<string>();
        const traverser = new ModelTraverser({
            visitSumType(type: SumType, traverser: ModelTraverser): SumType {
                for (const member of type.members) {
                    if (member instanceof NamedTypeReference) {
                        sumMembers.add(member.names[member.names.length - 1]);
                    }
                }
                traverser.visitSumTypeChildren(type);
                return type;
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
}

class TransformToGrammarWithTypes extends Transformer {
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

        new Traverser(new PropagateFieldMultiplicity()).visitRuleBody(body);

        const fields: Out.Field[] = [];
        new Traverser(new CollectFields(fields)).visitRuleBody(body);

        /*
            Merge fields that have the same name.

            if they have equal base types
                replace the type with a SequenceType of that baseType
            else 
               replace the type with a SumType of all the types.

            // TODO: if they are all SequenceTypes, make a SequenceType of the SumType of the base types
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

        const baseTypeOf = (type: Type): Type => {
            if (type instanceof SequenceType) {
                return type.elementType;
            } else if (type instanceof OptionType) {
                return baseTypeOf(type.type);
            }
            return type;
        };

        for (const fields of duplicatedFields) {
            const theBaseType = baseTypeOf(fields[0].type);
            let theNewType;
            if (fields.every((f) => typesAreEqual(baseTypeOf(f.type), theBaseType))) {
                theNewType = new SequenceType(theBaseType);
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

    visitChoiceRule(rules: Out.ChoiceRule, traverser: Traverser): Out.ChoiceRule {
        // TODO: Should be option types?
        traverser.visitChoiceRuleChildren(rules);
        return rules;
    }

    visitEnumRule(rule: Out.EnumRule, traverser: Traverser): Out.EnumRule {
        if (rule.field) this.fields.push(rule.field);
        return rule;
    }

    visitRuleReference(ruleReference: Out.RuleReference, traverser: Traverser): Out.RuleReference {
        if (ruleReference.field) this.fields.push(ruleReference.field);
        return ruleReference;
    }

    visitCharSet(charSet: Out.CharSet, traverser: Traverser): Out.CharSet {
        if (charSet.field) this.fields.push(charSet.field);
        return charSet;
    }

    visitStringElement(stringElement: Out.StringElement, traverser: Traverser): Out.StringElement {
        if (stringElement.field) this.fields.push(stringElement.field);
        return stringElement;
    }

    visitAnyElement(anyElement: Out.AnyElement, traverser: Traverser): Out.AnyElement {
        if (anyElement.field) this.fields.push(anyElement.field);
        return anyElement;
    }
}

class PropagateFieldMultiplicity extends CollectFields {
    transformFieldType(field: Out.Field, count: Out.Count): void {
        if (field.type) {
            switch (count) {
                case Out.Count.ZeroOrMore:
                case Out.Count.OneOrMore:
                    field.type = new SequenceType(field.type);
                    break;
                case Out.Count.Optional:
                    if (
                        field.type === 'boolean' ||
                        field.type instanceof SequenceType ||
                        field.type instanceof OptionType
                    ) {
                    } else {
                        field.type = new OptionType(field.type);
                    }
                    break;
                default:
                    break;
            }
        }
    }

    visitSeparatedByRule(rule: Out.SeparatedByRule, traverser: Traverser): Out.RuleBody {
        let oldFieldLength = this.fields.length;
        traverser.visitSeparatedByRuleChildren(rule);
        for (let i = oldFieldLength; i < this.fields.length; i++) {
            this.transformFieldType(this.fields[i], Out.Count.ZeroOrMore);
        }

        return rule;
    }

    visitCountedRuleElement(element: Out.CountedRuleElement, traverser: Traverser): Out.CountedRuleElement {
        let oldFieldLength = this.fields.length;
        traverser.visitCountedRuleElementChildren(element);
        if (element.count) {
            for (let i = oldFieldLength; i < this.fields.length; i++) {
                this.transformFieldType(this.fields[i], element.count);
            }
        }

        return element;
    }
}
