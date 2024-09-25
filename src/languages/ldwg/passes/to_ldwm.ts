import {
    ArrayType,
    BooleanType,
    EnumType,
    Model,
    NamedType,
    NamedTypeReference,
    OptionalType,
    ProductType,
    ProductTypeField,
    StringType,
    SumType,
    Type,
    VoidType
} from '../../ldwm/model';
import {
    AlternativeRule,
    AlternativeRules,
    AnyElement,
    CharSet,
    Count,
    CountedRuleElement,
    GrammarLanguage,
    IdentifierRule,
    PrattRule,
    Rule,
    RuleAnnotation,
    RuleReference,
    SequenceRule,
    StringElement
} from '../model';
import { alternativeRulesAsEnum } from '../utils';

export class ToLDWM {
    private rules: Map<string, Rule | PrattRule | IdentifierRule> = new Map();
    private typeReferenceFixups: {
        typeReference: NamedTypeReference;
        name: string;
    }[] = [];
    private output: Model = new Model('?');

    transform(input: GrammarLanguage): Model {
        this.output.name = input.grammar.name;

        input.grammar.rules.forEach((rule) => {
            this.rules.set(rule.name, rule);
        });

        for (const rule of input.grammar.rules) {
            if (rule instanceof Rule) {
                this.processRule(rule);
            } else if (rule instanceof PrattRule) {
                this.processPrattRule(rule);
            } else if (rule instanceof IdentifierRule) {
                this.processIdentifierRule(rule);
            }
        }

        for (const { typeReference, name } of this.typeReferenceFixups) {
            const target = this.output.namedTypes.get(name);
            if (!target) {
                throw new Error(`Type reference target not found: ${name}`);
            }
            typeReference.target = target;
        }

        return this.output;
    }

    processRule(rule: Rule) {
        if (rule.annotation == RuleAnnotation.Atomic) {
            const t = new ProductType();
            t.fields.push(new ProductTypeField('value', new StringType()));
            this.output.addNamedType(rule.name, t);
        } else if (rule.body instanceof SequenceRule) {
            this.output.addNamedType(
                rule.name,
                this.processSequenceRule(rule.body)
            );
        } else {
            this.output.addNamedType(
                rule.name,
                this.processAlternativeRules(rule.body)
            );
        }
    }

    processPrattRule(rule: PrattRule) {
        throw new Error('Pratt rules not implemented');
    }

    processIdentifierRule(rule: IdentifierRule) {
        if (rule.ruleAnnotation == RuleAnnotation.Atomic) {
            const t = new ProductType();
            t.fields.push(new ProductTypeField('value', new StringType()));
            this.output.addNamedType(rule.name, t);
        } else if (rule.ruleBodies[0] instanceof SequenceRule) {
            this.processSequenceRule(rule.ruleBodies[0]);
        } else {
            this.processAlternativeRules(rule.ruleBodies[0]);
        }
    }

    processSequenceRule(sequenceRule: SequenceRule): Type {
        let t = new ProductType();
        for (const element of sequenceRule.elements) {
            if (element instanceof CountedRuleElement) {
                let field = this.processCountedRuleElement(element);
                if (field) {
                    t.fields.push(field);
                }
            }
        }
        return t;
    }

    processAlternativeRules(rules: AlternativeRules): Type {
        if (rules.alternatives.length === 0) return new VoidType();

        // all StringElement or labeled literal -> enum

        let enumMembers = alternativeRulesAsEnum(rules);
        if (enumMembers) {
            const t = new EnumType();
            t.members = enumMembers;
            return t;
        }

        // otherwise -> union

        const u = new SumType();
        u.members = rules.alternatives.map((alternative) =>
            this.processSequenceRule(alternative.sequenceRule)
        );
        return u;
    }

    processCountedRuleElement(
        element: CountedRuleElement
    ): ProductTypeField | undefined {
        let type;
        let name = element.label;
        const cre = element.countableRuleElement;
        if (cre instanceof RuleReference) {
            let defaultName = cre.names[cre.names.length - 1];
            // if (!name) name = defaultName;
            // Use singleton for placeholder
            type = new NamedTypeReference(
                new NamedType('**Invalid**', new VoidType())
            );
            this.typeReferenceFixups.push({
                typeReference: type,
                name: defaultName
            });
        } else if (cre instanceof AnyElement) {
            if (!name) return undefined;
            // TODO: use singleton
            type = new StringType();
        } else if (cre instanceof StringElement) {
            if (!name) return undefined;
            // This represents the presence or not of a string,
            // hence the representation is a boolean
            // TODO: use singleton
            type = new BooleanType();
        } else if (cre instanceof CharSet) {
            if (!name) return undefined;
            // TODO: use singleton
            type = new StringType();
        } else if (cre instanceof SequenceRule) {
            type = this.processSequenceRule(cre);
        } else {
            // if (cre instanceof AlternativeRules) {
            type = this.processAlternativeRules(cre);
        }

        if (type == undefined) return undefined;

        if (
            element.count == Count.ZeroOrMore ||
            element.count == Count.OneOrMore
        ) {
            type = new ArrayType(type);
        } else if (
            element.count == Count.Optional &&
            !(type instanceof BooleanType || type instanceof OptionalType)
        ) {
            type = new OptionalType(type);
        }

        return new ProductTypeField(name ?? '_', type);
    }
}
