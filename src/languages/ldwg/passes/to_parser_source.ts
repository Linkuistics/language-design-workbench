import { pascalCase } from 'literal-case';
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

export class GrammarToParser {
    anonymousNameCounter: number = 0;
    parsers: string[] = [];

    transform(input: GrammarLanguage): string {
        for (const rule of input.grammar.rules) {
            if (rule instanceof Rule) {
                this.processRule(rule);
            } else if (rule instanceof PrattRule) {
                this.processPrattRule(rule);
            } else if (rule instanceof IdentifierRule) {
                this.processIdentifierRule(rule);
            }
        }
        const prelude = `
import { InputStream } from './src/parser/inputStream';
import * as Model from './model';
import { Parser } from './src/parser/parser';
import { ParseError } from './src/parser/parseError';

type TriviaKind = 'LineComment' | 'BlockComment' | 'Whitespace';

export class ${pascalCase(input.grammar.name)}Parser extends Parser {
    constructor(input: InputStream) {
        super(input);
    }

    parse(): Model.${pascalCase(input.grammar.name)}Language {
        const result = this.parse${pascalCase(input.grammar.name)}();
        if (!this.isEOF()) {
            throw new ParseError(
                'Unexpected trailing content',
                this.getPosition(),
                this
            );
        }
        return new Model.${pascalCase(input.grammar.name)}Language(result);
    }

        `;
        const postlude = `

}
        `;

        return `${prelude}${this.parsers.join('\n\n')}${postlude}`;
    }

    processRule(rule: Rule) {
        let body;
        if (rule.annotation == RuleAnnotation.Atomic) {
            body = '/* ATOMIC */';
        } else if (rule.body instanceof SequenceRule) {
            body = this.processSequenceRule(rule.body);
        } else {
            body = this.processAlternativeRules(rule.body);
        }

        const pcname = pascalCase(rule.name);
        this.parsers.push(
            `private parse${pcname}(): Model.${pcname} {\n${body}\n}`
        );
    }

    processPrattRule(rule: PrattRule) {
        throw new Error('Pratt rules not implemented');
    }

    processIdentifierRule(rule: IdentifierRule) {
        let body;
        if (rule.ruleAnnotation == RuleAnnotation.Atomic) {
            body = '/* ATOMIC */';
        } else if (rule.ruleBodies[0] instanceof SequenceRule) {
            body = this.processSequenceRule(rule.ruleBodies[0]);
        } else {
            body = this.processAlternativeRules(rule.ruleBodies[0]);
        }

        const pcname = pascalCase(rule.name);
        this.parsers.push(
            `private parse${pcname}(): Model.${pcname} {\n${body}\n}`
        );
    }

    processSequenceRule(sequenceRule: SequenceRule): string[] {
        return sequenceRule.elements.flatMap((element) => {
            if (element instanceof CountedRuleElement) {
                return this.processCountedRuleElement(element);
            } else {
                return ['/* NEGATIVE LOOKAHEAD */'];
            }
        });
    }

    processAlternativeRules(rules: AlternativeRules): string[] {
        if (rules.alternatives.length === 0) return [];

        // all StringElement or labeled literal -> enum

        const names = rules.alternatives.map((alt) =>
            this.labeledLiteralOrString(alt)
        );
        if (names.every((name) => name !== undefined)) {
            return names.map((name) => `this.consumeString('${name}')`);
        }

        // otherwise -> union

        const bodies = rules.alternatives.map((alternative) =>
            this.processSequenceRule(alternative.sequenceRule)
        );
        let closures = bodies.map((body) => {
            if (bodies.length === 1) return `() => ${body}`;
            else {
            }
        });
        return [`this.firstAlternative("something",\n${closures.join(',\n')})`];
    }

    labeledLiteralOrString(
        alternativeRule: AlternativeRule
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
        return name.length > 0 ? name : `_${this.anonymousNameCounter++}`;
    }

    processCountedRuleElement(element: CountedRuleElement): string[] {
        const cre = element.countableRuleElement;
        let body;
        if (cre instanceof RuleReference) {
            body = [
                `this.parse${pascalCase(cre.names[cre.names.length - 1])}()`
            ];
        } else if (cre instanceof AnyElement) {
            body = [`this.consume()`];
        } else if (cre instanceof StringElement) {
            body = [`this.consumeString('${cre.value}')`];
        } else if (cre instanceof CharSet) {
            body = [`this.consumeRegex(//)`];
        } else if (cre instanceof SequenceRule) {
            body = this.processSequenceRule(cre);
        } else if (cre instanceof AlternativeRules) {
            body = this.processAlternativeRules(cre);
        } else throw new Error('Unexpected countable rule element');

        if (element.count == Count.ZeroOrMore) {
            return [`this.zeroOrMore(() => ${body})`];
        } else if (element.count == Count.OneOrMore) {
            return [`this.oneOrMore(() => ${body})`];
        } else if (element.count == Count.Optional) {
            return body;
        } else {
            return [`this.must(${body}, "something")`];
        }
    }
}
