import { InputStream } from '../../parser/inputStream';
import * as Model from './model';
import { Parser } from '../../parser/parser';
import { ParseError } from '../../parser/parseError';

type TriviaKind = 'LineComment' | 'BlockComment' | 'Whitespace';

export class GrammarParser extends Parser {
    constructor(input: InputStream) {
        super(input);
    }

    parse(): Model.GrammarLanguage {
        const grammar = this.parseGrammar();
        if (!this.isEOF()) {
            throw new ParseError(
                'Unexpected content after grammar',
                this.getPosition(),
                this
            );
        }
        return new Model.GrammarLanguage(grammar);
    }

    private parseGrammar(): Model.Grammar {
        return this.withContext('grammar', () => {
            this.mustConsumeKeyword('grammar');
            const name = this.parseName();
            this.mustConsume('{');
            const rules = this.zeroOrMore(() => {
                return this.alternatives(
                    () => this.parsePrattRule(),
                    () => this.parseIdentifierRule(),
                    () => this.parseRule()
                );
            });
            this.mustConsume('}');
            return new Model.Grammar(name, rules);
        });
    }

    private parseRule(): Model.Rule {
        return this.withContext('rule', () => {
            const name = this.parseName();
            const annotation = this.parseOptionalRuleAnnotation();
            const versionAnnotations = this.zeroOrMore(() =>
                this.parseVersionAnnotation()
            );
            this.mustConsume('=');
            const body = this.parseRuleBody();
            this.mustConsume(';');
            return new Model.Rule(name, body, annotation, versionAnnotations);
        });
    }

    private parseOptionalRuleAnnotation(): Model.RuleAnnotation | undefined {
        if (this.consumeString('@noskip')) return Model.RuleAnnotation.NoSkip;
        if (this.consumeString('@atomic')) return Model.RuleAnnotation.Atomic;
    }

    private parsePrattRule(): Model.PrattRule {
        this.mustConsumeKeyword('pratt');
        const name = this.parseName();
        const versionAnnotations = this.zeroOrMore(() =>
            this.parseVersionAnnotation()
        );
        this.mustConsume('{');
        let operators = this.oneOrMore(() => this.parsePrattOperator());
        let primary = this.parsePrattPrimary();
        this.mustConsume('}');
        return new Model.PrattRule(
            name,
            operators,
            primary,
            versionAnnotations
        );
    }

    private parsePrattOperator(): Model.PrattOperator {
        const type = this.parsePrattOperatorType();
        const name = this.parseName();
        const versionAnnotations = this.zeroOrMore(() =>
            this.parseVersionAnnotation()
        );
        this.mustConsume('=');
        const body = this.parseRuleBody();
        this.mustConsume(';');
        return new Model.PrattOperator(type, name, body, versionAnnotations);
    }

    private parsePrattPrimary(): Model.PrattPrimary {
        this.mustConsumeKeyword('primary');
        const name = this.parseName();
        this.mustConsume('=');
        const body = this.parseRuleBody();
        this.mustConsume(';');
        return new Model.PrattPrimary(name, body);
    }

    private parsePrattOperatorType(): Model.PrattOperatorType {
        if (this.consumeString('prefix')) return Model.PrattOperatorType.Prefix;
        if (this.consumeString('postfix'))
            return Model.PrattOperatorType.Postfix;
        if (this.consumeString('left')) return Model.PrattOperatorType.Left;
        if (this.consumeString('right')) return Model.PrattOperatorType.Right;
        throw new ParseError(
            'Invalid pratt operator type',
            this.getPosition(),
            this
        );
    }

    private parseIdentifierRule(): Model.IdentifierRule {
        return this.withContext('identifier_rule', () => {
            this.mustConsumeKeyword('identifier');
            const name = this.parseName();
            const ruleAnnotation = this.parseOptionalRuleAnnotation();
            const versionAnnotations = this.zeroOrMore(() =>
                this.parseVersionAnnotation()
            );
            this.mustConsume('=');
            return this.alternatives(
                () => {
                    this.mustConsume('(');
                    let ruleBodies = [];
                    ruleBodies.push(this.parseRuleBody());
                    this.mustConsume(')');
                    this.mustConsumeKeyword('excluding');
                    this.mustConsume('(');
                    ruleBodies.push(this.parseRuleBody());
                    this.mustConsume(')');
                    this.mustConsume(';');
                    return new Model.IdentifierRule(
                        name,
                        ruleBodies,
                        ruleAnnotation,
                        versionAnnotations
                    );
                },
                () => {
                    const ruleBodies = [this.parseRuleBody()];
                    this.mustConsume(';');
                    return new Model.IdentifierRule(
                        name,
                        ruleBodies,
                        ruleAnnotation,
                        versionAnnotations
                    );
                }
            );
        });
    }

    private parseVersionAnnotation(): Model.VersionAnnotation {
        return this.withContext('version_annotation', () => {
            const type = this.parseVersionAnnotationType();
            return this.ignoreTriviaDuring(() => {
                this.mustConsume('(');
                const version = this.parseVersionNumber();
                this.mustConsume(')');
                return new Model.VersionAnnotation(type, version);
            });
        });
    }

    private parseVersionAnnotationType(): Model.VersionAnnotationType {
        if (this.consumeString('@enabled'))
            return Model.VersionAnnotationType.Enabled;
        if (this.consumeString('@disabled'))
            return Model.VersionAnnotationType.Disabled;
        throw new ParseError(
            'Invalid version annotation type',
            this.getPosition(),
            this
        );
    }

    private parseVersionNumber(): Model.VersionNumber {
        const segments = [
            this.parseVersionSegment(),
            ...this.zeroOrMore(() => {
                this.consumeString('.');
                return this.parseVersionSegment();
            })
        ];
        return new Model.VersionNumber(segments);
    }

    private parseVersionSegment(): Model.VersionSegment {
        return this.must(
            this.consumeRegex(/^[0-9]+/),
            'Expected version segment'
        );
    }

    private parseRuleBody(): Model.RuleBody {
        return this.withContext('rule_body', () => {
            return this.alternatives(
                () => new Model.SequenceRule(this.parseSequenceRule()),
                () =>
                    new Model.AlternativeRules(
                        this.oneOrMore(() => this.parseAlternativeRule())
                    )
            );
        });
    }

    private parseAlternativeRule(): Model.AlternativeRule {
        return this.withContext('alternative_rule', () => {
            const label = this.parseOptionalLabel();
            this.mustConsume('|');
            const versionAnnotations = this.zeroOrMore(() =>
                this.parseVersionAnnotation()
            );
            const sequenceRule = new Model.SequenceRule(
                this.parseSequenceRule()
            );
            return new Model.AlternativeRule(
                sequenceRule,
                label,
                versionAnnotations
            );
        });
    }

    private parseSequenceRule(): Model.RuleElement[] {
        return this.withContext('rule_element_sequence', () => {
            return this.oneOrMore(() => this.parseRuleElement());
        });
    }

    private parseRuleElement(): Model.RuleElement {
        return this.withContext('rule_element', () => {
            return this.alternatives(
                () => this.parseCountedRuleElement(),
                () => this.parseNegativeLookahead()
            );
        });
    }

    private parseCountedRuleElement(): Model.CountedRuleElement {
        const label = this.parseOptionalLabel();
        const countableRuleElement = this.parseCountableRuleElement();
        const count = this.parseOptionalCount();
        const versionAnnotations = this.zeroOrMore(() =>
            this.parseVersionAnnotation()
        );
        return new Model.CountedRuleElement(
            countableRuleElement,
            label,
            count,
            versionAnnotations
        );
    }

    private parseCountableRuleElement(): Model.CountableRuleElement {
        return this.withContext('countable_rule_element', () => {
            return this.alternatives(
                () => this.parseRuleReference(),
                () => new Model.StringElement(this.parseString()),
                () => this.parseCharset(),
                () => this.parseAny(),
                () => {
                    this.mustConsume('(');
                    const body = this.parseRuleBody();
                    this.mustConsume(')');
                    return body;
                }
            );
        });
    }

    private parseRuleReference(): Model.RuleReference {
        return this.withContext('rule_reference', () => {
            const names: Model.Name[] = [];
            names.push(this.parseName());
            this.zeroOrMore(() => {
                this.mustConsume('::');
                names.push(this.parseName());
            });
            return new Model.RuleReference(names);
        });
    }

    private parseOptionalCount(): Model.Count | undefined {
        if (this.consumeString('+')) return Model.Count.OneOrMore;
        if (this.consumeString('*')) return Model.Count.ZeroOrMore;
        if (this.consumeString('?')) return Model.Count.Optional;
        return undefined;
    }

    private parseName(): Model.Name {
        return this.must(
            this.consumeRegex(/^[a-zA-Z_][a-zA-Z0-9_]*/),
            'Expected name'
        );
    }

    private parseOptionalLabel(): Model.Label | undefined {
        const startPos = this.getPosition();
        const name = this.maybe(() => this.parseName());
        if (name && this.consumeString(':')) {
            return name + ':';
        }
        this.restorePosition(startPos);
        return undefined;
    }

    private parseString(): string {
        const quote = this.must(
            this.consumeString("'") || this.consumeString('"'),
            'Expected string'
        );

        return this.ignoreTriviaDuring(() => {
            let str = '';
            while (!this.isEOF() && this.peek() !== quote) {
                const escape = this.consumeString('\\');
                if (escape) str += escape;
                str += this.must(this.consume(), 'Unexpected end of string');
            }

            this.mustConsume(quote);
            return str;
        });
    }

    private parseCharset(): Model.CharSet {
        return this.ignoreTriviaDuring(() => {
            this.mustConsume('[');
            const negated = this.consumeString('^') !== undefined;
            const ranges = [];

            while (!this.isEOF() && this.peek() !== ']') {
                const startChar = this.parseCharsetChar();
                let endChar;
                if (this.consumeString('-') && this.peek() !== ']') {
                    endChar = this.parseCharsetChar();
                }
                ranges.push({ startChar, endChar });
            }

            this.mustConsume(']');
            return new Model.CharSet(negated, ranges);
        });
    }

    private parseCharsetChar(): Model.CharSetChar {
        if (this.consumeString('\\')) {
            const escaped = this.must(
                this.consume(),
                'Expected escaped character in charset'
            );
            return '\\' + escaped;
        }
        return this.must(this.consume(), 'Expected character in charset');
    }

    private parseAny(): Model.AnyElement {
        this.mustConsume('.');
        return new Model.AnyElement();
    }

    private parseNegativeLookahead(): Model.NegativeLookahead {
        this.mustConsume('!');
        let content = this.ignoreTriviaDuring(() => {
            return this.alternatives(
                () => this.parseCharset(),
                () => new Model.StringElement(this.parseString())
            );
        });
        return new Model.NegativeLookahead(content);
    }

    private parseTrivia(): TriviaKind | undefined {
        if (this.parseLineComment()) return 'LineComment';
        if (this.parseBlockComment()) return 'BlockComment';
        if (this.parseWhitespace()) return 'Whitespace';
        return undefined;
    }

    private parseLineComment(): boolean {
        if (this.consumeString('//') === undefined) return false;
        this.consumeWhile((c) => c !== '\n');
        this.consumeString('\n');
        return true;
    }

    private parseBlockComment(): boolean {
        if (this.consumeString('/*') === undefined) return false;
        while (
            this.consumeRegex(/[^*]+/) !== undefined ||
            (this.consumeString('*') !== undefined && this.peek() !== '/')
        ) {}
        if (this.consumeString('/') === undefined) return false;
        return true;
    }

    private parseWhitespace(): boolean {
        return this.consumeRegex(/[\n\t ]+/) !== undefined;
    }

    protected consumeTrivia(): string | undefined {
        return this.parseTrivia();
    }

    protected consumeIdentifierForKeyword(): string | undefined {
        return this.consumeRegex(/^[a-zA-Z_][a-zA-Z0-9_]*/);
    }
}
