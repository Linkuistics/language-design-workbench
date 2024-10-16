import { camelCase, pascalCase } from 'literal-case';
import { IndentingOutputStream } from '../../../../../output/indentingOutputStream';
import * as Model from '../model';
import { Visitor } from '../visitor';
import * as LdwModelParsed from '../../../model/parsed/model';
import { assert } from 'console';
import { typeAsTypescript } from '../../../model/parsed/typescript';
import { singular } from 'pluralize';

export class GrammarWithTypesToParserTypescriptSource {
    transform(grammar: Model.Grammar): string {
        let output = new IndentingOutputStream();

        const parserGenerator = new ParserGenerator(output);
        const lexerGenerator = new LexerGenerator(output);

        output.writeLine("import { InputStream } from './src/gen0/parsing/inputStream';");
        output.writeLine("import * as Model from './src/gen0/languages/ldw/grammar/parsed/model';");
        output.writeLine("import { Parser, ParseResult } from './src/gen0/parsing/parser';");
        output.writeLine("import * as Builder from './src/gen0/parsing/builder';");
        output.writeLine();
        output.writeLine(`export class ${pascalCase(grammar.names[grammar.names.length - 1])}Parser extends Parser {`);

        output.indentDuring(() => {
            output.writeLine('consumeTrivia(): string | undefined { return undefined }');
            output.writeLine('consumeIdentifierForKeyword(): string | undefined { return undefined }');
            output.writeLine();
            parserGenerator.visitGrammar(grammar);
            lexerGenerator.visitGrammar(grammar);
        });

        // const triviaRule = grammar.rules.find((rule) => rule.name.toLowerCase() === 'trivia');
        // if (triviaRule && triviaRule instanceof Model.Rule) {
        //     output += parserGenerator.generateTriviaHandlingMethods(triviaRule);
        // }

        // const identifierRule = grammar.rules.find((rule) => rule.name.toLowerCase() === 'identifier');
        // if (identifierRule && identifierRule instanceof Model.Rule) {
        //     output += parserGenerator.generateConsumeIdentifierForKeyword(identifierRule);
        // }

        output.writeLine('}');

        grammar.rules.forEach((rule) => {
            generateBuildFunction(rule, output);
        });

        return output.toString().trim();
    }
}

function generateBuildFunction(rule: Model.Rule, output: IndentingOutputStream): void {
    if (rule.annotation === Model.RuleAnnotation.Atomic) return;

    const ruleName = pascalCase(rule.name);

    switch (rule.type.discriminator) {
        case LdwModelParsed.Discriminator.SequenceType:
            output.writeLine(
                `function build${ruleName}(stack: Builder.Stack): Model.${ruleName} { return stack.map(x => x.value) }`
            );
            output.writeLine();
            break;
        case LdwModelParsed.Discriminator.ProductType:
            output.writeLine(`function build${ruleName}(stack: Builder.Stack): Model.${ruleName} {`);
            if (rule.type.members.length === 0) {
                output.writeLine(`return new Model.${ruleName}()`);
            } else {
                rule.type.members.forEach((member) => {
                    if (LdwModelParsed.isSequenceType(member.type)) {
                        output.writeLine(
                            `let ${camelCase(member.name)}: ${typeAsTypescript(member.type, 'Model.')} = [];`
                        );
                    } else {
                        output.writeLine(`let ${camelCase(member.name)}: ${typeAsTypescript(member.type, 'Model.')};`);
                    }
                });
                output.writeLine(`for (const x of stack) { switch (x.label) {`);
                rule.type.members.forEach((member) => {
                    output.writeLine(`case '${singular(camelCase(member.name))}':`);
                    if (LdwModelParsed.isSequenceType(member.type)) {
                        const elementType = member.type.elementType;
                        output.writeLine(
                            `${camelCase(member.name)}.push(x.value as ${typeAsTypescript(elementType, 'Model.')});`
                        );
                    } else {
                        output.writeLine(
                            `${camelCase(member.name)} = x.value as ${typeAsTypescript(member.type, 'Model.')};`
                        );
                    }
                    output.writeLine('break');
                });
                output.writeLine(`default: break`);
                output.writeLine(`}}`);
                output.writeLine(`return new Model.${ruleName}({`);
                rule.type.members.forEach((member) => {
                    output.writeLine(`${camelCase(member.name)}: ${camelCase(member.name)}!,`);
                });
                output.writeLine(`})`);
            }
            output.writeLine(`}`);
            output.writeLine();
            break;
        default:
            break;
    }
}

class ParserGenerator extends Visitor {
    constructor(public output: IndentingOutputStream) {
        super();
    }

    useLabelParameter = false;
    ruleName: string = '';

    visitRule(rule: Model.Rule): void {
        if (rule.annotation === Model.RuleAnnotation.Atomic) return;

        this.ruleName = pascalCase(rule.name);
        this.useLabelParameter = false;

        this.output.writeLine(`parse${this.ruleName}(label: string | undefined): boolean {`);
        this.output.indentDuring(() => {
            switch (rule.type.discriminator) {
                case LdwModelParsed.Discriminator.NamedTypeReference:
                case LdwModelParsed.Discriminator.SumType:
                    this.output.write(`return `);
                    this.useLabelParameter = true;
                    this.visitRuleBody(rule.body);
                    break;
                case LdwModelParsed.Discriminator.SequenceType:
                case LdwModelParsed.Discriminator.ProductType:
                    this.output.write(`return this.buildObject(label, build${this.ruleName}, () => `);
                    this.visitRuleBody(rule.body);
                    this.output.writeLine(`)`);
                    break;
                case LdwModelParsed.Discriminator.EnumType:
                    this.output.writeLine(`return this.buildEnum(label,`);
                    this.output.join(rule.type.members, ',', (member) => {
                        this.output.writeLine(`[ '${member}', Model.${this.ruleName}.${pascalCase(member)} ]`);
                    });
                    this.output.writeLine(`)`);
                    break;
                default:
                    throw new Error(`Not yet implemented: rule type discriminator ${rule.type.discriminator}`);
            }
        });
        this.output.writeLine('}');
        this.output.writeLine();
    }

    visitSequenceRule(node: Model.SequenceRule): void {
        if (node.elements.length === 1) {
            this.visitRuleElement(node.elements[0]);
        } else {
            this.output.writeLine(`this.skipSeq(() => `);
            this.output.join(node.elements, ' && ', (element) => this.visitRuleElement(element));
            this.output.writeLine(`)`);
        }
    }

    visitChoiceRule(node: Model.ChoiceRule): void {
        // Opportunity to join CharSet children
        this.output.writeLine(`(`);
        this.output.join(node.choices, ' || ', (choice) => this.visitSequenceRule(choice));
        this.output.writeLine(`)`);
    }

    visitEnumRule(node: Model.EnumRule): void {
        throw new Error('Not implemented');
    }

    visitSeparatedByRule(node: Model.SeparatedByRule): void {
        throw new Error('Not implemented');
    }

    visitCountedRuleElement(node: Model.CountedRuleElement): void {
        // Oportunity to lift CharSet children
        switch (node.count) {
            case Model.Count.OneOrMore:
                this.output.writeLine('this.skipOneOrMore(() => ');
                super.visitCountedRuleElement(node);
                this.output.writeLine(')');
                break;
            case Model.Count.ZeroOrMore:
                this.output.writeLine('this.skipZeroOrMore(() => ');
                super.visitCountedRuleElement(node);
                this.output.writeLine(')');
                break;
            case Model.Count.Optional:
                this.output.writeLine('this.skipOptional(() => ');
                super.visitCountedRuleElement(node);
                this.output.writeLine(')');
                break;
            default:
                super.visitCountedRuleElement(node);
        }
    }

    visitRuleReference(node: Model.RuleReference): void {
        if (node.field) {
            if (this.useLabelParameter) {
                this.output.writeLine(`this.parse${pascalCase(node.names[node.names.length - 1])}(label)`);
            } else {
                this.output.writeLine(
                    `this.parse${pascalCase(node.names[node.names.length - 1])}('${camelCase(node.field.name!)}')`
                );
            }
        } else {
            this.output.writeLine(`this.lex${pascalCase(node.names[node.names.length - 1])}()`);
        }
    }

    visitStringElement(node: Model.StringElement): void {
        let text = node.value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        if (node.field) {
            this.output.writeLine(
                `this.buildBoolean('${camelCase(node.field.name!)}', () => this.skipString('${text}'))`
            );
        } else {
            this.output.writeLine(`this.skipString('${text}')`);
        }
    }

    visitCharSet(node: Model.CharSet): void {
        // TODO: lots of opportunity to optimise for specific regex forms
        const regex = charSetToRegex(node);
        if (node.field) {
            this.output.writeLine(`this.buildString('${camelCase(node.field.name!)}', () => this.skipRegex(${regex}))`);
            this.output.writeLine(`)`);
        } else {
            this.output.writeLine(`this.skipRegex(${regex})`);
        }
    }

    visitAnyElement(node: Model.AnyElement): void {
        throw new Error('Not implemented');
    }

    visitNegativeLookahead(node: Model.NegativeLookahead): void {
        throw new Error('Not implemented');
    }
}

class LexerGenerator extends Visitor {
    constructor(public output: IndentingOutputStream) {
        super();
    }

    visitRule(rule: Model.Rule): void {
        if (rule.annotation !== Model.RuleAnnotation.Atomic) return;

        const name = pascalCase(rule.name);

        this.output.writeLine(`parse${name}(label: string | undefined): boolean {`);
        this.output.indentDuring(() => {
            if (LdwModelParsed.isPrimitiveType(rule.type)) {
                this.output.writeLine(`return this.buildString(label, () => this.lex${name}())`);
            } else {
                this.output.writeLine(`return this.buildStringOnject(label, Model.${name}, () => this.lex${name}())`);
            }
        });
        this.output.writeLine('}');
        this.output.writeLine();

        this.output.writeLine(`lex${name}(): boolean {`);
        this.output.indentDuring(() => {
            this.output.write('return ');
            super.visitRule(rule);
        });
        this.output.writeLine('}');
        this.output.writeLine();
    }

    visitSequenceRule(node: Model.SequenceRule): void {
        if (node.elements.length === 1) {
            this.visitRuleElement(node.elements[0]);
        } else {
            this.output.writeLine(`this.skipSeq(() => `);
            this.output.join(node.elements, ' && ', (element) => this.visitRuleElement(element));
            this.output.writeLine(`)`);
        }
    }

    visitChoiceRule(node: Model.ChoiceRule): void {
        // Oportunity to join CharSet children
        this.output.writeLine(`(`);
        this.output.join(node.choices, ' || ', (choice) => this.visitSequenceRule(choice));
        this.output.writeLine(`)`);
    }

    visitEnumRule(node: Model.EnumRule): void {
        throw new Error('Not implemented');
    }

    visitSeparatedByRule(node: Model.SeparatedByRule): void {
        throw new Error('Not implemented');
    }

    visitCountedRuleElement(node: Model.CountedRuleElement): void {
        // Oportunity to lift CharSet children
        switch (node.count) {
            case Model.Count.OneOrMore:
                this.output.writeLine('this.skipOneOrMore(() => ');
                super.visitCountedRuleElement(node);
                this.output.writeLine(')');
                break;
            case Model.Count.ZeroOrMore:
                this.output.writeLine('this.skipZeroOrMore(() => ');
                super.visitCountedRuleElement(node);
                this.output.writeLine(')');
                break;
            case Model.Count.Optional:
                this.output.writeLine('this.skipOptional(() => ');
                super.visitCountedRuleElement(node);
                this.output.writeLine(')');
                break;
            default:
                super.visitCountedRuleElement(node);
        }
    }

    visitRuleReference(node: Model.RuleReference): void {
        // TODO: must earlier validate that atomic rules only refer to other atomic rules
        this.output.writeLine(`this.lex${pascalCase(node.names[node.names.length - 1])}()`);
    }

    visitStringElement(node: Model.StringElement): void {
        let text = node.value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        this.output.writeLine(`this.skipString('${text}')`);
    }

    visitCharSet(node: Model.CharSet): void {
        // TODO: lots of opportunity to optimise for specific regex forms
        const regex = charSetToRegex(node);
        this.output.writeLine(`this.skipRegex(${regex})`);
    }

    visitNegativeLookahead(node: Model.NegativeLookahead): void {
        this.output.write('this.skipNegativeLookahead(() =>');
        super.visitNegativeLookahead(node);
        this.output.write(')');
    }

    visitAnyElement(node: Model.AnyElement): void {
        this.output.writeLine('this.skip()');
    }
}

function charSetToRegex(charSet: Model.CharSet): string {
    let regex = charSet.negated ? '/[^' : '/[';
    for (let i = 0; i < charSet.startChars.length; i++) {
        const startChar = charSet.startChars[i];
        const endChar = charSet.endChars[i];
        if (endChar) {
            regex += `${startChar}-${endChar}`;
        } else {
            regex += startChar;
        }
    }
    regex += ']/';
    return regex;
}
