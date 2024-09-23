import {
    ArrayType,
    BooleanType,
    CharType,
    EnumType,
    ModelLanguage,
    NamedType,
    NamedTypeReference,
    OptionalType,
    ProductType,
    ProductTypeField,
    StringType,
    SumType,
    Type,
    VoidType
} from '../../model/model';
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

export class GrammarToModel {
    private rules: Map<string, Rule | PrattRule | IdentifierRule> = new Map();
    private anonymousNameCounter: number = 0;
    private typeReferenceFixups: {
        typeReference: NamedTypeReference;
        name: string;
    }[] = [];
    private output: ModelLanguage = new ModelLanguage();

    transform(input: GrammarLanguage): ModelLanguage {
        input.grammar.rules.forEach((rule) => {
            this.rules.set(rule.name, rule);
        });
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
                this.processSequenceRule(rule.body, rule.name)
            );
        } else {
            this.output.addNamedType(
                rule.name,
                this.processAlternativeRules(rule.body, rule.name)
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
            this.processSequenceRule(rule.ruleBodies[0], rule.name);
        } else {
            this.processAlternativeRules(rule.ruleBodies[0], rule.name);
        }
    }

    processSequenceRule(sequenceRule: SequenceRule, ruleName: string): Type {
        let t = new ProductType();
        for (const element of sequenceRule.elements) {
            if (element instanceof CountedRuleElement) {
                let field = this.processCountedRuleElement(element, ruleName);
                if (field) {
                    t.fields.push(new ProductTypeField(field.name, field.type));
                }
            }
        }
        return t;
    }

    processAlternativeRules(rules: AlternativeRules, ruleName: string): Type {
        if (rules.alternatives.length === 0) return new VoidType();

        // all StringElement or labeled literal -> enum

        const names = rules.alternatives.map((alt) =>
            this.labeledLiteralOrString(alt, ruleName)
        );
        if (names.every((name) => name !== undefined)) {
            const t = new EnumType();
            new Set(names).forEach((name) => t.members.push(name));
            return t;
        }

        // otherwise -> union

        const u = new SumType();
        u.members = rules.alternatives.map((alternative) =>
            this.processSequenceRule(alternative.sequenceRule, ruleName)
        );
        return u;
    }

    labeledLiteralOrString(
        alternativeRule: AlternativeRule,
        ruleName: string
    ): string | undefined {
        const sequenceRule = alternativeRule.sequenceRule;
        if (sequenceRule.elements.length !== 1) return undefined;
        const element = sequenceRule.elements[0];
        if (!(element instanceof CountedRuleElement)) return undefined;
        const cre = element.countableRuleElement;
        if (element.label) return element.label.slice(0, -1);
        if (!(cre instanceof StringElement)) return undefined;
        const name = cre.value.replace(/[^a-zA-Z0-9]/g, (char) => {
            return '';
        });
        return name.length > 0 ? name : this.makeName(ruleName);
    }

    processCountedRuleElement(
        element: CountedRuleElement,
        ruleName: string
    ): ProductTypeField | undefined {
        let type;
        let name = element.label?.slice(0, -1);
        const cre = element.countableRuleElement;
        if (cre instanceof RuleReference) {
            let defaultName = cre.names[cre.names.length - 1];
            if (!name) name = defaultName;
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
            type = new CharType();
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
            if (!name) name = '?';
            const localName = `${ruleName}.${name}`;
            type = this.processSequenceRule(cre, localName);
        } else {
            //if (cre instanceof AlternativeRules) {
            if (!name) name = '?';
            const localName = `${ruleName}.${name}`;
            type = this.processAlternativeRules(cre, localName);
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

        return {
            name,
            type
        };
    }

    makeName(ruleName: string): string {
        return `${ruleName}/${this.anonymousNameCounter++}`;
    }
}
