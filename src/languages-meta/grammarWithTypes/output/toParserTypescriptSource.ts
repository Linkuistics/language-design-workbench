import {
    ChoiceRule,
    AnyElement,
    CharSet,
    Count,
    CountableRuleElement,
    CountedRuleElement,
    Grammar,
    PrattRule,
    Rule,
    RuleElement,
    RuleReference,
    SequenceRule,
    StringElement,
    SeparatedByRule,
    EnumRule
} from '../model';

export class GrammarWithTypesToParserTypescriptSource {
    transform(input: Grammar): string {
        return generateParser(input);
    }
}

const VERSION = '1.0.6';

interface ParserOptions {
    className?: string;
    debug?: boolean;
    memoize?: boolean;
    memoizeCacheSize?: number;
}

function generateParser(grammar: Grammar, options: ParserOptions = {}): string {
    const className = options.className || 'GeneratedParser';
    const debug = options.debug || false;
    const memoize = options.memoize || false;
    const memoizeCacheSize = options.memoizeCacheSize || 1000;

    let output = `
        // Generated parser - version ${VERSION}
        // Generated on: ${new Date().toISOString()}

        import { InputStream } from '../../parser/inputStream';
        import * as Model from './model';
        import { Parser } from '../../parser/parser';

        export class ${className} extends Parser {
            private debug: boolean;
            private memoizationCache: Map<string, any>;
            private readonly MEMOIZE_CACHE_SIZE = ${memoizeCacheSize};

            constructor(input: InputStream, debug: boolean = false) {
                super(input);
                this.debug = debug;
                this.memoizationCache = new Map();
            }

            clearMemoizationCache(): void {
                this.memoizationCache.clear();
            }

            getMemoizationCacheSize(): number {
                return this.memoizationCache.size;
            }
    `;

    for (const rule of grammar.rules) {
        output += generateParseMethod(rule, debug, memoize);
    }

    const triviaRule = grammar.rules.find(
        (rule) => rule.name.toLowerCase() === 'trivia'
    );
    if (triviaRule && triviaRule instanceof Rule) {
        output += generateTriviaHandlingMethods(triviaRule, debug);
    }

    const identifierRule = grammar.rules.find(
        (rule) => rule.name.toLowerCase() === 'identifier'
    );
    if (identifierRule && identifierRule instanceof Rule) {
        // output += generateConsumeIdentifierForKeyword(identifierRule);
    }

    output += '}';

    return output;
}

function generateParseMethod(
    rule: Rule | PrattRule,
    debug: boolean,
    memoize: boolean
): string {
    const methodName = `parse${capitalize(rule.name)}`;
    let methodBody = '';

    if (rule instanceof Rule) {
        methodBody = generateRuleBody(rule.body, debug);
    } else {
        // if (rule instanceof PrattRule) {
        return ''; // Ignore PrattRules
    }

    let parseMethod = memoize
        ? `
            ${methodName}(): Model.${rule.name} {
                const cacheKey = \`${methodName}_\${this.getPosition()}\`;
                if (this.memoizationCache.has(cacheKey)) {
                    return this.memoizationCache.get(cacheKey);
                }
                ${methodBody} return result;
                if (this.memoizationCache.size >= this.MEMOIZE_CACHE_SIZE) {
                    const oldestKey = this.memoizationCache.keys().next().value;
                    this.memoizationCache.delete(oldestKey);
                }
                this.memoizationCache.set(cacheKey, result);
            }
          `
        : `
            ${methodName}(): Model.${rule.name} {
                ${methodBody} return result;
            }
          `;

    return parseMethod;
}

function generateRuleBody(
    ruleBody: SequenceRule | ChoiceRule | EnumRule | SeparatedByRule,
    debug: boolean
): string {
    if (ruleBody instanceof SequenceRule) {
        return generateSequenceRuleBody(ruleBody, debug);
    } else if (ruleBody instanceof ChoiceRule) {
        return generateAlternativeRulesBody(ruleBody, debug);
    } else if (ruleBody instanceof EnumRule) {
        return '';
        // return generateEnumRuleBody(ruleBody, debug);
    } else {
        return '';
        // return generateSeparatedByRuleBody(ruleBody, debug);
    }
}

function generateSequenceRuleBody(
    sequenceRule: SequenceRule,
    debug: boolean
): string {
    let body = '';
    let declarations = '';
    let constructorArgs = [];

    for (const element of sequenceRule.elements) {
        const { declaration, parsing, argName } = generateElementParsing(
            element,
            debug
        );
        declarations += declaration;
        body += parsing;
        if (argName) {
            constructorArgs.push(argName);
        }
    }

    body += `const result = new Model.${sequenceRule.constructor.name}(${constructorArgs.join(', ')});`;
    return declarations + body;
}

function generateAlternativeRulesBody(
    alternativeRules: ChoiceRule,
    debug: boolean
): string {
    const alternatives = alternativeRules.choices
        .map(
            (cre) => `() => {
            ${generateElementParsing(cre, debug)}
            return result;
        }`
        )
        .join(',');

    return `const result = this.firstAlternative('${alternativeRules.choices[0].constructor.name.toLowerCase()}', ${alternatives});`;
}

function generateElementParsing(
    element: RuleElement | CountableRuleElement,
    debug: boolean
): { declaration: string; parsing: string; argName?: string } {
    if (element instanceof CountedRuleElement) {
        return generateCountedElementParsing(element, debug);
    } else if (element instanceof RuleReference) {
        const argName = element.names[0].toLowerCase();
        return {
            declaration: `let ${argName}: Model.${element.names[0]};`,
            parsing: `${argName} = this.parse${capitalize(element.names[0])}();`,
            argName
        };
    } else if (element instanceof StringElement) {
        return {
            declaration: '',
            parsing: ` this.mustConsumeString('${element.value}');`
        };
    } else if (element instanceof CharSet) {
        return {
            declaration: '',
            parsing: ` this.mustConsumeRegex(${charSetToRegex(element)});`
        };
    } else if (element instanceof AnyElement) {
        return {
            declaration: '',
            parsing: ` this.consumeAny();`
        };
    } else if (element instanceof SequenceRule) {
        return generateSequenceRuleElementParsing(element, debug);
    } else if (element instanceof ChoiceRule) {
        return generateAlternativeRulesElementParsing(element, debug);
    } else {
        // if (element instanceof NegativeLookahead) {
        return {
            declaration: '',
            parsing: `/* NEGATIVE LOOKAHEAD */`
        };
    }
}

function generateSequenceRuleElementParsing(
    sequenceRule: SequenceRule,
    debug: boolean
): { declaration: string; parsing: string; argName?: string } {
    const parsing = generateSequenceRuleBody(sequenceRule, debug);
    return {
        declaration: '',
        parsing: `{
            ${parsing}
        }`
    };
}

function generateAlternativeRulesElementParsing(
    alternativeRules: ChoiceRule,
    debug: boolean
): { declaration: string; parsing: string; argName?: string } {
    const parsing = generateAlternativeRulesBody(alternativeRules, debug);
    return {
        declaration: '',
        parsing: `{
            ${parsing}
        }`
    };
}

function generateCountedElementParsing(
    countedElement: CountedRuleElement,
    debug: boolean
): { declaration: string; parsing: string; argName?: string } {
    const { countableRuleElement, count } = countedElement;
    const { declaration, parsing, argName } = generateElementParsing(
        countableRuleElement,
        debug
    );
    let wrappedParsing = '';

    switch (count) {
        case Count.Optional:
            wrappedParsing = ` this.maybe(() => { ${parsing} });`;
            break;
        case Count.ZeroOrMore:
            wrappedParsing = ` this.zeroOrMore(() => { ${parsing} });`;
            break;
        case Count.OneOrMore:
            wrappedParsing = ` this.oneOrMore(() => { ${parsing} });`;
            break;
        default:
            wrappedParsing = parsing;
    }

    return { declaration, parsing: wrappedParsing, argName };
}

function generateTriviaHandlingMethods(
    triviaRule: Rule,
    debug: boolean
): string {
    let methods = `
    protected consumeTrivia(): string | undefined {
        return this.parseTrivia()?.constructor.name;
    }

    // private parseTrivia(): string | undefined {
    //     this.log('Parsing trivia');`;

    // if (triviaRule.body instanceof AlternativeRules) {
    //     triviaRule.body.alternatives.forEach((alt, index) => {
    //         if (alt.sequenceRule.elements[0] instanceof RuleReference) {
    //             const ruleName = alt.sequenceRule.elements[0].names[0];
    //             methods += `
    //     if (this.parse${capitalize(ruleName)}()) {
    //         this.log('Found trivia: ${ruleName}');
    //         return '${ruleName}';
    //     }`;
    //         }
    //     });
    // }

    // methods += `
    //     this.log('No trivia found');
    //     return undefined;
    // }`;

    return methods;
}

function charSetToRegex(charSet: CharSet): string {
    let regex = charSet.negated ? '/^[^' : '/^[';
    for (const range of charSet.ranges) {
        if (range.endChar) {
            regex += `${range.startChar}-${range.endChar}`;
        } else {
            regex += range.startChar;
        }
    }
    regex += ']/';
    return regex;
}

function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export { generateParser, ParserOptions };
