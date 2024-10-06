import {
    SequenceRule,
    AlternativeRules,
    RuleReference,
    StringElement,
    CharSet,
    AnyElement,
    AlternativeRule,
    RuleElement,
    Count,
    CountedRuleElement,
    CountableRuleElement,
    Grammar,
    Rule,
    IdentifierRule,
    PrattRule
} from './model';

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

    let output = `// Generated parser - version ${VERSION}
// Generated on: ${new Date().toISOString()}

import { InputStream } from '../../parser/inputStream';
import * as Model from './model';
import { Parser } from '../../parser/parser';
import { ParseError } from '../../parser/parseError';

export class ${className} extends Parser {
    private debug: boolean;
    private memoizationCache: Map<string, any>;
    private readonly MEMOIZE_CACHE_SIZE = ${memoizeCacheSize};

    constructor(input: InputStream, debug: boolean = false) {
        super(input);
        this.debug = debug;
        this.memoizationCache = new Map();
    }

    private log(message: string): void {
        if (this.debug) {
            console.log(\`[${className}] \${message}\`);
        }
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
        (rule) => rule instanceof IdentifierRule
    );
    if (identifierRule && identifierRule instanceof IdentifierRule) {
        output += generateConsumeIdentifierForKeyword(identifierRule);
    }

    output += '}';

    return output;
}

function generateParseMethod(
    rule: Rule | IdentifierRule | PrattRule,
    debug: boolean,
    memoize: boolean
): string {
    const methodName = `parse${capitalize(rule.name)}`;
    let methodBody = '';

    if (rule instanceof Rule) {
        methodBody = generateRuleBody(rule.body, debug);
    } else if (rule instanceof IdentifierRule) {
        methodBody = generateIdentifierRuleBody(rule, debug);
    } else if (rule instanceof PrattRule) {
        return ''; // Ignore PrattRules
    }

    let parseMethod = `
    ${methodName}(): Model.${rule.name} {
        ${
            memoize
                ? `const cacheKey = \`${methodName}_\${this.getPosition()}\`;
        if (this.memoizationCache.has(cacheKey)) {
            return this.memoizationCache.get(cacheKey);
        }`
                : ''
        }
        return this.withContext('${rule.name.toLowerCase()}', () => {
            this.log('Entering ${methodName}');
            try {
                ${methodBody}
            } catch (error) {
                this.log(\`Error in ${methodName}: \${error.message}\`);
                throw new ParseError(\`Failed to parse ${rule.name}: \${error.message}\`, this.getPosition(), this);
            } finally {
                this.log('Exiting ${methodName}');
            }
        })${
            memoize
                ? `;
        if (this.memoizationCache.size >= this.MEMOIZE_CACHE_SIZE) {
            const oldestKey = this.memoizationCache.keys().next().value;
            this.memoizationCache.delete(oldestKey);
        }
        this.memoizationCache.set(cacheKey, result);
        return result;`
                : ';'
        }
    }`;

    return parseMethod;
}

function generateRuleBody(
    ruleBody: SequenceRule | AlternativeRules,
    debug: boolean
): string {
    if (ruleBody instanceof SequenceRule) {
        return generateSequenceRuleBody(ruleBody, debug);
    } else if (ruleBody instanceof AlternativeRules) {
        return generateAlternativeRulesBody(ruleBody, debug);
    }
    throw new Error('Unsupported rule body type');
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

    body += `const result = new Model.${sequenceRule.constructor.name}(${constructorArgs.join(', ')});
    this.log('Created ${sequenceRule.constructor.name}');
    return result;`;
    return declarations + body;
}

function generateAlternativeRulesBody(
    alternativeRules: AlternativeRules,
    debug: boolean
): string {
    const alternatives = alternativeRules.alternatives
        .map(
            (alt, index) => `() => {
            this.log('Trying alternative ${index + 1}');
            ${generateSequenceRuleBody(alt.sequenceRule, debug)}
        }`
        )
        .join(',');

    return `return this.firstAlternative('${alternativeRules.alternatives[0].sequenceRule.elements[0].constructor.name.toLowerCase()}', ${alternatives});`;
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
            parsing: `this.log('Consuming string: ${element.value}'); this.mustConsumeString('${element.value}');`
        };
    } else if (element instanceof CharSet) {
        return {
            declaration: '',
            parsing: `this.log('Consuming regex: ${charSetToRegex(element)}'); this.mustConsumeRegex(${charSetToRegex(element)});`
        };
    } else if (element instanceof AnyElement) {
        return {
            declaration: '',
            parsing: `this.log('Consuming any character'); this.consumeAny();`
        };
    }
    throw new Error(
        `Unsupported rule element type: ${element.constructor.name}`
    );
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
            wrappedParsing = `this.log('Parsing optional element'); this.maybe(() => { ${parsing} });`;
            break;
        case Count.ZeroOrMore:
            wrappedParsing = `this.log('Parsing zero or more elements'); this.zeroOrMore(() => { ${parsing} });`;
            break;
        case Count.OneOrMore:
            wrappedParsing = `this.log('Parsing one or more elements'); this.oneOrMore(() => { ${parsing} });`;
            break;
        default:
            wrappedParsing = parsing;
    }

    return { declaration, parsing: wrappedParsing, argName };
}

function generateIdentifierRuleBody(
    identifierRule: IdentifierRule,
    debug: boolean
): string {
    let body = `this.log('Parsing identifier');`;

    if (identifierRule.ruleBodies.length === 1) {
        const ruleBody = identifierRule.ruleBodies[0];
        body += `return ${generateRuleBodyForIdentifier(ruleBody)};`;
    } else if (identifierRule.ruleBodies.length === 2) {
        const [includeBody, excludeBody] = identifierRule.ruleBodies;
        body += `const identifier = ${generateRuleBodyForIdentifier(includeBody)};
        if (${generateRuleBodyForIdentifier(excludeBody, true)}) {
            throw new ParseError('Identifier matches excluded pattern', this.getPosition(), this);
        }
        return identifier;`;
    } else {
        throw new Error(
            'IdentifierRule must have either one or two rule bodies'
        );
    }

    return body;
}

function generateRuleBodyForIdentifier(
    ruleBody: SequenceRule | AlternativeRules,
    isExclude: boolean = false
): string {
    if (ruleBody instanceof SequenceRule) {
        return generateSequenceRuleBodyForIdentifier(ruleBody, isExclude);
    } else if (ruleBody instanceof AlternativeRules) {
        return generateAlternativeRulesBodyForIdentifier(ruleBody, isExclude);
    }
    throw new Error('Unsupported rule body type for identifier');
}

function generateSequenceRuleBodyForIdentifier(
    sequenceRule: SequenceRule,
    isExclude: boolean
): string {
    const regexParts = sequenceRule.elements.map((element) => {
        if (element instanceof CharSet) {
            return charSetToRegex(element).slice(2, -1);
        } else if (element instanceof StringElement) {
            return element.value.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        } else {
            throw new Error(
                'Unsupported element type in identifier sequence rule'
            );
        }
    });

    const regex = regexParts.join('');
    return isExclude
        ? `this.peekRegex(/^${regex}/)`
        : `this.mustConsumeRegex(/^${regex}/, 'identifier')`;
}

function generateAlternativeRulesBodyForIdentifier(
    alternativeRules: AlternativeRules,
    isExclude: boolean
): string {
    const regexParts = alternativeRules.alternatives.map((alt) => {
        if (
            alt.sequenceRule.elements.length === 1 &&
            alt.sequenceRule.elements[0] instanceof CharSet
        ) {
            return charSetToRegex(
                alt.sequenceRule.elements[0] as CharSet
            ).slice(2, -1);
        } else {
            throw new Error(
                'Unsupported alternative rule structure in identifier'
            );
        }
    });

    const regex = regexParts.join('|');
    return isExclude
        ? `this.peekRegex(/^(${regex})/)`
        : `this.mustConsumeRegex(/^(${regex})/, 'identifier')`;
}

function generateConsumeIdentifierForKeyword(
    identifierRule: IdentifierRule
): string {
    return `
    protected consumeIdentifierForKeyword(): string | undefined {
        const startPosition = this.getPosition();
        try {
            return ${generateRuleBodyForIdentifier(identifierRule.ruleBodies[0])};
        } catch (error) {
            this.restorePosition(startPosition);
            return undefined;
        }
    }`;
}

function generateTriviaHandlingMethods(
    triviaRule: Rule,
    debug: boolean
): string {
    let methods = `
    protected consumeTrivia(): string | undefined {
        return this.parseTrivia();
    }

    private parseTrivia(): string | undefined {
        this.log('Parsing trivia');`;

    if (triviaRule.body instanceof AlternativeRules) {
        triviaRule.body.alternatives.forEach((alt, index) => {
            if (alt.sequenceRule.elements[0] instanceof RuleReference) {
                const ruleName = alt.sequenceRule.elements[0].names[0];
                methods += `
        if (this.parse${capitalize(ruleName)}()) {
            this.log('Found trivia: ${ruleName}');
            return '${ruleName}';
        }`;
            }
        });
    }

    methods += `
        this.log('No trivia found');
        return undefined;
    }`;

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
