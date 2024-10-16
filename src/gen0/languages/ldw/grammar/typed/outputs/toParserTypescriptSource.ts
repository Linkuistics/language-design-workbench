import { pascalCase } from 'literal-case';
import { IndentingOutputStream } from '../../../../../output/indentingOutputStream';
import * as Model from '../model';
import { Visitor } from '../visitor';
import * as LdwModelParsed from '../../../model/parsed/model';

export class GrammarWithTypesToParserTypescriptSource {
    transform(grammar: Model.Grammar): string {
        let output = new IndentingOutputStream();

        const parserGenerator = new ParserGenerator(output);
        const lexerGenerator = new LexerGenerator(output);

        output.writeLine("import { InputStream } from './src/gen0/parsing/inputStream';");
        output.writeLine("import * as Model from './src/gen0/languages/ldw/grammar/parsed/model';");
        output.writeLine("import { Parser, ParseResult } from './src/gen0/parsing/parser';");
        output.writeLine();
        output.writeLine(`export class ${pascalCase(grammar.names[grammar.names.length - 1])}Parser extends Parser {`);

        output.indentDuring(() => {
            output.writeLine('consumeTrivia(): string | undefined { return undefined }');
            output.writeLine('consumeIdentifierForKeyword(): string | undefined { return undefined }');
            output.writeLine();
            // parserGenerator.visitGrammar(grammar);
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

        return output.toString().trim();
    }
}

class ParserGenerator extends Visitor {
    constructor(public output: IndentingOutputStream) {
        super();
    }

    visitRule(rule: Model.Rule): void {
        if (rule.annotation === Model.RuleAnnotation.Atomic) return;

        const methodName = `parse${pascalCase(rule.name)}`;
        this.output.writeLine(`${methodName}(): ParseResult<Model.${pascalCase(rule.name)}> {`);
        this.output.indentDuring(() => {
            if (rule.annotation === Model.RuleAnnotation.NoSkip) {
                this.output.writeLine('return this.ignoreTriviaDuring(() => {');
                this.output.indentDuring(() => {
                    super.visitRule(rule);
                });
                this.output.writeLine('});');
            } else {
                super.visitRule(rule);
            }
        });
        this.output.writeLine('}');
        this.output.writeLine();
    }

    visitCountedRuleElement(node: Model.CountedRuleElement): void {
        switch (node.count) {
            case Model.Count.OneOrMore:
                this.output.writeLine(`return this.oneOrMore(() => {`);
                this.output.indentDuring(() => {
                    super.visitCountedRuleElement(node);
                });
                this.output.writeLine('});');
                break;
            case Model.Count.ZeroOrMore:
                this.output.writeLine(`return this.zeroOrMore(() => {`);
                this.output.indentDuring(() => {
                    super.visitCountedRuleElement(node);
                });
                this.output.writeLine('});');
                break;
            case Model.Count.Optional:
                this.output.writeLine(`return this.maybe(() => {`);
                this.output.indentDuring(() => {
                    super.visitCountedRuleElement(node);
                });
                this.output.writeLine('});');
                break;
            default:
                super.visitCountedRuleElement(node);
        }
    }

    visitChoiceRule(node: Model.ChoiceRule): void {
        this.output.writeLine('/* Choice */');
    }

    visitEnumRule(node: Model.EnumRule): void {
        this.output.writeLine('/* Enum */');
    }

    visitSeparatedByRule(node: Model.SeparatedByRule): void {
        this.output.writeLine('/* SeparatedBy */');
    }

    visitRuleReference(node: Model.RuleReference): void {
        this.output.writeLine(`const result = this.parse${pascalCase(node.names[node.names.length - 1])}();`);
        this.output.writeLine(`if (!result.success) return result;`);
    }

    visitStringElement(node: Model.StringElement): void {
        this.output.writeLine(`const result = this.mustConsumeString('${node.value}');`);
        this.output.writeLine(`if (!result.success) return result;`);
    }

    visitNegativeLookahead(node: Model.NegativeLookahead): void {
        throw new Error('Not implemented - negative lookahead in non-atomic rule');
    }

    visitCharSet(node: Model.CharSet): void {
        throw new Error('Not implemented - char set in non-atomic rule');
    }

    visitAnyElement(node: Model.AnyElement): void {
        throw new Error('Not implemented - any element in non-atomic rule');
    }
}

class LexerGenerator extends Visitor {
    tempCount = 0;

    constructor(public output: IndentingOutputStream) {
        super();
    }

    visitRule(rule: Model.Rule): void {
        if (rule.annotation !== Model.RuleAnnotation.Atomic) return;

        const name = pascalCase(rule.name);

        this.tempCount = 0;

        this.output.writeLine(`lex${name}(): boolean {`);
        this.output.indentDuring(() => {
            this.output.write('return ');
            super.visitRule(rule);
        });
        this.output.writeLine('}');
        this.output.writeLine();

        this.output.writeLine(`parse${name}(): ParseResult<Model.${name}> {`);
        this.output.indentDuring(() => {
            this.output.writeLine('const start = this.getPosition();');
            this.output.writeLine(`return this.lex${name}()`);
            this.output.indentDuring(() => {
                if (LdwModelParsed.isPrimitiveType(rule.type)) {
                    this.output.writeLine(`? this.success(this.makeString(start, this.input.getPosition()))`);
                } else {
                    this.output.writeLine(
                        `? this.success(new Model.${name}({ value: this.makeString(start, this.input.getPosition()) }))`
                    );
                }
                this.output.writeLine(`: this.failure("Failed to lex a ${name}");`);
            });
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
        this.output.writeLine(`(`);
        this.output.join(node.choices, ' || ', (choice) => this.visitSequenceRule(choice));
        this.output.writeLine(`)`);
    }

    visitEnumRule(node: Model.EnumRule): void {
        throw new Error('Not implemented - enum in atomic rule');
    }

    visitSeparatedByRule(node: Model.SeparatedByRule): void {
        throw new Error('Not implemented - separatedBy in atomic rule');
    }

    visitCountedRuleElement(node: Model.CountedRuleElement): void {
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

    visitNegativeLookahead(node: Model.NegativeLookahead): void {
        this.output.write('this.skipNegativeLookahead(() =>');
        super.visitNegativeLookahead(node);
        this.output.write(')');
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
        const regex = charSetToRegex(node);
        this.output.writeLine(`this.skipRegex(${regex})`);
    }

    visitAnyElement(node: Model.AnyElement): void {
        this.output.writeLine('this.skip()');
    }
}

function charSetToRegex(charSet: Model.CharSet): string {
    let regex = charSet.negated ? '/^[^' : '/^[';
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

// class ParserGenerator {
//     constructor(public grammar: Model.Grammar) {}

//     generateParseMethod(rule: Model.Rule, debug: boolean): string {
//         const methodName = `parse${capitalize(rule.name)}`;
//         let methodBody = generateRuleBody(rule.body, debug);

//         if (rule.annotation) {
//             methodBody = wrapWithAnnotation(methodBody, rule.annotation);
//         }

//         if (rule.versionAnnotations.length > 0) {
//             methodBody = wrapWithVersionAnnotations(methodBody, rule.versionAnnotations);
//         }

//         return `
//         ${methodName}(): ParseResult<Model.${rule.name}> {
//             let result: ParseResult<Model.${rule.name}>;
//             ${methodBody}
//             return result;
//         }
//     `;
//     }

//     generateRuleBody(
//         ruleBody: Model.SequenceRule | Model.ChoiceRule | Model.EnumRule | Model.SeparatedByRule,
//         debug: boolean
//     ): string {
//         switch (ruleBody.discriminator) {
//             case Model.Discriminator.SequenceRule:
//                 return generateSequenceRuleBody(ruleBody as Model.SequenceRule, debug);
//             case Model.Discriminator.ChoiceRule:
//                 return generateChoiceRuleBody(ruleBody as Model.ChoiceRule, debug);
//             case Model.Discriminator.EnumRule:
//                 return generateEnumRuleBody(ruleBody as Model.EnumRule, debug);
//             case Model.Discriminator.SeparatedByRule:
//                 return generateSeparatedByRuleBody(ruleBody as Model.SeparatedByRule, debug);
//         }
//     }

//     generateSequenceRuleBody(sequenceRule: Model.SequenceRule, debug: boolean): string {
//         let body = '';
//         let declarations = '';
//         let constructorArgs = [];

//         for (const element of sequenceRule.elements) {
//             const { declaration, parsing, argName } = generateElementParsing(element, debug);
//             declarations += declaration;
//             body += parsing;
//             if (argName) {
//                 constructorArgs.push(argName);
//             }
//         }

//         body += `result = this.success(new Model.SequenceRule({ ${constructorArgs.join(', ')} }));`;
//         return declarations + body;
//     }

//     generateChoiceRuleBody(choiceRule: Model.ChoiceRule, debug: boolean): string {
//         const alternatives = choiceRule.choices
//             .map(
//                 (choice, index) => `() => {
//             ${generateElementParsing(choice, debug).parsing}
//             return result;
//         }`
//             )
//             .join(',');

//         return `result = this.firstAlternative('choice_rule', ${alternatives});`;
//     }

//     generateEnumRuleBody(enumRule: Model.EnumRule, debug: boolean): string {
//         const alternatives = enumRule.members
//             .map(
//                 (member) => `() => {
//             const memberResult = this.mustConsumeString('${member}');
//             if (memberResult.success) {
//                 return this.success(${JSON.stringify(member)});
//             }
//             return memberResult;
//         }`
//             )
//             .join(',');

//         return `result = this.firstAlternative('enum_rule', ${alternatives});`;
//     }

//     generateSeparatedByRuleBody(separatedByRule: Model.SeparatedByRule, debug: boolean): string {
//         const { parsing: elementParsing } = generateElementParsing(separatedByRule.element, debug);
//         const { parsing: separatorParsing } = generateElementParsing(separatedByRule.separator, debug);

//         return `
//         const elements: any[] = [];
//         let firstElement = ${elementParsing};
//         if (!firstElement.success) {
//             result = firstElement;
//         } else {
//             elements.push(firstElement.value);

//             while (true) {
//                 const startPos = this.getPosition();
//                 const separatorResult = ${separatorParsing};
//                 if (!separatorResult.success) {
//                     this.restorePosition(startPos);
//                     break;
//                 }
//                 const nextElement = ${elementParsing};
//                 if (!nextElement.success) {
//                     this.restorePosition(startPos);
//                     break;
//                 }
//                 elements.push(nextElement.value);
//             }

//             result = this.success(new Model.SeparatedByRule({ elements }));
//         }
//     `;
//     }

//     generateElementParsing(
//         element: Model.RuleElement | Model.CountableRuleElement,
//         debug: boolean
//     ): { declaration: string; parsing: string; argName?: string } {
//         switch (element.discriminator) {
//             case Model.Discriminator.CountedRuleElement:
//                 return generateCountedElementParsing(element as Model.CountedRuleElement, debug);
//             case Model.Discriminator.RuleReference:
//                 const ruleRef = element as Model.RuleReference;
//                 const argName = ruleRef.names[0].toLowerCase();
//                 return {
//                     declaration: `let ${argName}: any;`,
//                     parsing: `${argName} = this.parse${capitalize(ruleRef.names[0])}();`,
//                     argName
//                 };
//             case Model.Discriminator.StringElement:
//                 const stringElem = element as Model.StringElement;
//                 return {
//                     declaration: '',
//                     parsing: `this.mustConsumeString('${stringElem.value}');`
//                 };
//             case Model.Discriminator.CharSet:
//                 const charSet = element as Model.CharSet;
//                 return {
//                     declaration: '',
//                     parsing: `this.mustConsumeRegex(${charSetToRegex(charSet)});`
//                 };
//             case Model.Discriminator.AnyElement:
//                 return {
//                     declaration: '',
//                     parsing: `this.consumeAny();`
//                 };
//             case Model.Discriminator.NegativeLookahead:
//                 const negLookahead = element as Model.NegativeLookahead;
//                 const { parsing: contentParsing } = generateElementParsing(negLookahead.content, debug);
//                 return {
//                     declaration: '',
//                     parsing: `
//                     const startPos = this.getPosition();
//                     const lookaheadResult = ${contentParsing};
//                     this.restorePosition(startPos);
//                     if (lookaheadResult.success) {
//                         return this.failure('Negative lookahead failed');
//                     }
//                 `
//                 };
//             default:
//                 throw new Error(`Unsupported element type: ${(element as any).discriminator}`);
//         }
//     }

//     generateCountedElementParsing(
//         countedElement: Model.CountedRuleElement,
//         debug: boolean
//     ): { declaration: string; parsing: string; argName?: string } {
//         const { countableRuleElement, count } = countedElement;
//         const { declaration, parsing, argName } = generateElementParsing(countableRuleElement, debug);
//         let wrappedParsing = '';

//         switch (count) {
//             case Model.Count.Optional:
//                 wrappedParsing = `this.maybe(() => { ${parsing} });`;
//                 break;
//             case Model.Count.ZeroOrMore:
//                 wrappedParsing = `this.zeroOrMore(() => { ${parsing} });`;
//                 break;
//             case Model.Count.OneOrMore:
//                 wrappedParsing = `this.oneOrMore(() => { ${parsing} });`;
//                 break;
//             default:
//                 wrappedParsing = parsing;
//         }

//         return { declaration, parsing: wrappedParsing, argName };
//     }

//     generateTriviaHandlingMethods(triviaRule: Model.Rule, debug: boolean): string {
//         return `
//     protected consumeTrivia(): string | undefined {
//         return this.parseTrivia()?.constructor.name;
//     }

//     private parseTrivia(): Model.Trivia | undefined {
//         let result: ParseResult<Model.Trivia>;
//         ${generateRuleBody(triviaRule.body, debug)}
//         return result.success ? result.value : undefined;
//     }`;
//     }

//     generateConsumeIdentifierForKeyword(identifierRule: Model.Rule): string {
//         return `
//     protected consumeIdentifierForKeyword(): string | undefined {
//         const startPos = this.getPosition();
//         let result: ParseResult<Model.Identifier>;
//         ${generateRuleBody(identifierRule.body, false)}
//         if (result.success) {
//             return result.value;
//         }
//         this.restorePosition(startPos);
//         return undefined;
//     }`;
//     }

//     wrapWithAnnotation(methodBody: string, annotation: Model.RuleAnnotation): string {
//         switch (annotation) {
//             case Model.RuleAnnotation.NoSkip:
//                 return `this.withNoSkip(() => { ${methodBody} })`;
//             case Model.RuleAnnotation.Atomic:
//                 return `this.atomic(() => { ${methodBody} })`;
//             default:
//                 return methodBody;
//         }
//     }

//     wrapWithVersionAnnotations(methodBody: string, annotations: Model.VersionAnnotation[]): string {
//         let wrappedBody = methodBody;
//         for (const annotation of annotations) {
//             wrappedBody = `
//             if (this.isVersionEnabled(${JSON.stringify(annotation.version)})) {
//                 ${wrappedBody}
//             } else {
//                 result = this.failure('Version not enabled');
//             }
//         `;
//         }
//         return wrappedBody;
//     }

//     charSetToRegex(charSet: Model.CharSet): string {
//         let regex = charSet.negated ? '/^[^' : '/^[';
//         for (let i = 0; i < charSet.startChars.length; i++) {
//             const startChar = charSet.startChars[i];
//             const endChar = charSet.endChars[i];
//             if (endChar) {
//                 regex += `${startChar}-${endChar}`;
//             } else {
//                 regex += startChar;
//             }
//         }
//         regex += ']/';
//         return regex;
//     }
// }
