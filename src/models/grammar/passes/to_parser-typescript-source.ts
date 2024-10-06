import { GrammarLanguage } from '../model';
import { generateParser } from '../parser-generator';

export class ToParserTypescriptSource {
    transform(input: GrammarLanguage): string {
        return generateParser(input.grammar);
    }
}
