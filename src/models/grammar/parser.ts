import { InputStream } from '../../parser/inputStream';
import { ParseError } from '../../parser/parseError';
import { Parser } from '../../parser/parser';
import * as Model from './model';

type TriviaKind = 'LineComment' | 'BlockComment' | 'Whitespace';

export class GrammarParser extends Parser {
    constructor(input: InputStream, debug: boolean = false) {
        super(input, debug);
    }

    parseGrammar(): Model.Grammar {
        return this.withContext('grammar', () => {
            let name: Model.Name;
            let rules: Model.Rule[] = [];
            let prattRules: Model.PrattRule[] = [];

            this.mustConsumeKeyword('grammar');
            name = this.parseName();
            this.mustConsumeString('{');
            this.zeroOrMore(() =>
                this.firstAlternative(
                    'grammar element',
                    () => {
                        const result = this.parsePrattRule();
                        if (result) prattRules.push(result);
                        return result;
                    },
                    () => {
                        const result = this.parseRule();
                        if (result) rules.push(result);
                        return result;
                    }
                )
            );
            this.mustConsumeString('}');

            return new Model.Grammar(name, rules, prattRules);
        });
    }

    private parseRule(): Model.Rule {
        return this.withContext('rule', () => {
            let name: Model.Name;
            let annotation: Model.RuleAnnotation | undefined;
            let versionAnnotations: Model.VersionAnnotation[];
            let body: Model.RuleBody;

            name = this.parseName();
            annotation = this.parseOptionalRuleAnnotation();
            versionAnnotations = this.parseVersionAnnotations();
            this.mustConsumeString('=');
            body = this.parseRuleBody();
            this.mustConsumeString(';');

            return new Model.Rule(name, body, annotation, versionAnnotations);
        });
    }

    private parseOptionalRuleAnnotation(): Model.RuleAnnotation | undefined {
        if (this.consumeString('@noskip')) return Model.RuleAnnotation.NoSkip;
        if (this.consumeString('@atomic')) return Model.RuleAnnotation.Atomic;
    }

    private parsePrattRule(): Model.PrattRule {
        let name: Model.Name;
        let versionAnnotations: Model.VersionAnnotation[];
        let operators: Model.PrattOperator[];
        let primary: Model.PrattPrimary;

        this.mustConsumeKeyword('pratt');
        name = this.parseName();
        versionAnnotations = this.parseVersionAnnotations();
        this.mustConsumeString('{');
        operators = this.oneOrMore(() => this.parsePrattOperator());
        primary = this.parsePrattPrimary();
        this.mustConsumeString('}');

        return new Model.PrattRule(
            name,
            operators,
            primary,
            versionAnnotations
        );
    }

    private parsePrattOperator(): Model.PrattOperator {
        let type: Model.PrattOperatorType;
        let name: Model.Name;
        let versionAnnotations: Model.VersionAnnotation[];
        let body: Model.RuleBody;

        type = this.parsePrattOperatorType();
        name = this.parseName();
        versionAnnotations = this.parseVersionAnnotations();
        this.mustConsumeString('=');
        body = this.parseRuleBody();
        this.mustConsumeString(';');

        return new Model.PrattOperator(type, name, body, versionAnnotations);
    }

    private parsePrattPrimary(): Model.PrattPrimary {
        let name: Model.Name;
        let body: Model.RuleBody;

        this.mustConsumeKeyword('primary');
        name = this.parseName();
        this.mustConsumeString('=');
        body = this.parseRuleBody();
        this.mustConsumeString(';');

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

    private parseVersionAnnotations(): Model.VersionAnnotation[] {
        return this.zeroOrMore(() => this.parseVersionAnnotation());
    }

    private parseVersionAnnotation(): Model.VersionAnnotation {
        return this.withContext('version_annotation', () => {
            let type: Model.VersionAnnotationType;
            let version: Model.VersionNumber;

            type = this.parseVersionAnnotationType();
            version = this.ignoreTriviaDuring(() => {
                this.mustConsumeString('(');
                const v = this.parseVersionNumber();
                this.mustConsumeString(')');
                return v;
            });

            return new Model.VersionAnnotation(type, version);
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
        let segments: Model.VersionSegment[];

        segments = [
            this.parseVersionSegment(),
            ...this.zeroOrMore(() => {
                this.consumeString('.');
                return this.parseVersionSegment();
            })
        ];

        return new Model.VersionNumber(segments);
    }

    private parseVersionSegment(): Model.VersionSegment {
        return this.mustConsumeRegex(/^[0-9]+/, 'version segment');
    }

    private parseRuleBody(): Model.RuleBody {
        return this.withContext('rule_body', () => {
            return this.firstAlternative(
                'rule body',
                () => this.parseAlternativeRules(),
                () => this.parseSequenceRule()
            );
        });
    }

    private parseAlternativeRules(): Model.ChoiceRule {
        return this.withContext('alternative_rule', () => {
            let alternatives: Model.SequenceRule[] = [];

            alternatives.push(this.parseSequenceRule());
            this.oneOrMore(() => {
                this.mustConsumeString('|');
                alternatives.push(this.parseSequenceRule());
            });

            return new Model.ChoiceRule(alternatives);
        });
    }

    private parseSequenceRule(): Model.SequenceRule {
        return this.withContext('rule_element_sequence', () => {
            return new Model.SequenceRule(
                this.oneOrMore(() => this.parseRuleElement())
            );
        });
    }

    private parseRuleElement(): Model.RuleElement {
        return this.withContext('rule_element', () => {
            return this.firstAlternative(
                'rule element or negative lookahead',
                () => this.parseCountedRuleElement(),
                () => this.parseNegativeLookahead()
            );
        });
    }

    private parseCountedRuleElement(): Model.CountedRuleElement {
        let label: Model.Label | undefined;
        let countableRuleElement: Model.CountableRuleElement;
        let count: Model.Count | undefined;
        let versionAnnotations: Model.VersionAnnotation[];

        label = this.parseOptionalLabel();
        countableRuleElement = this.parseCountableRuleElement();
        count = this.parseOptionalCount();
        versionAnnotations = this.parseVersionAnnotations();

        return new Model.CountedRuleElement(
            countableRuleElement,
            label,
            count,
            versionAnnotations
        );
    }

    private parseCountableRuleElement(): Model.CountableRuleElement {
        return this.withContext('countable_rule_element', () => {
            return this.firstAlternative(
                'countable rule element',
                () => this.parseRuleReference(),
                () => new Model.StringElement(this.parseString()),
                () => this.parseCharset(),
                () => this.parseAny(),
                () => {
                    let body: Model.RuleBody;

                    this.mustConsumeString('(');
                    body = this.parseRuleBody();
                    this.mustConsumeString(')');

                    return body;
                }
            );
        });
    }

    private parseRuleReference(): Model.RuleReference {
        return this.withContext('rule_reference', () => {
            let names: Model.Name[] = [];

            names.push(this.parseName());
            this.zeroOrMore(() => {
                this.mustConsumeString('::');
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
        return this.mustConsumeRegex(/^[a-zA-Z_][a-zA-Z0-9_]*/, 'name');
    }

    private parseOptionalLabel(): Model.Label | undefined {
        let startPos = this.getPosition();
        let name: Model.Name | undefined;

        name = this.maybe(() => this.parseName());
        if (name && this.consumeString(':')) {
            return name;
        }
        this.restorePosition(startPos);
        return undefined;
    }

    private parseString(): string {
        return this.ignoreTriviaDuring(() => {
            let quote: string;
            let str: string = '';

            quote = this.must(
                this.consumeString("'") || this.consumeString('"'),
                'string'
            );

            while (!this.isEOF() && this.peek() !== quote) {
                const escape = this.consumeString('\\');
                if (escape) str += escape;
                str += this.must(this.consume(), 'continuation of string');
            }

            this.mustConsumeString(quote);
            return str;
        });
    }

    private parseCharset(): Model.CharSet {
        return this.ignoreTriviaDuring(() => {
            let negated: boolean;
            let ranges: {
                startChar: Model.CharSetChar;
                endChar?: Model.CharSetChar;
            }[] = [];

            this.mustConsumeString('[');
            negated = this.consumeString('^') !== undefined;

            while (!this.isEOF() && this.peek() !== ']') {
                let startChar = this.parseCharsetChar();
                let endChar: Model.CharSetChar | undefined;
                if (this.consumeString('-') && this.peek() !== ']') {
                    endChar = this.parseCharsetChar();
                }
                ranges.push({ startChar, endChar });
            }

            this.mustConsumeString(']');
            return new Model.CharSet(negated, ranges);
        });
    }

    private parseCharsetChar(): Model.CharSetChar {
        if (this.consumeString('\\')) {
            const escaped = this.must(
                this.consume(),
                'escaped charset character'
            );
            return '\\' + escaped;
        }
        return this.must(this.consume(), 'charset character');
    }

    private parseAny(): Model.AnyElement {
        this.mustConsumeString('.');
        return new Model.AnyElement();
    }

    private parseNegativeLookahead(): Model.NegativeLookahead {
        let content: Model.CharSet | Model.StringElement;

        content = this.ignoreTriviaDuring(() => {
            this.mustConsumeString('!');
            return this.firstAlternative(
                'charset or string',
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
