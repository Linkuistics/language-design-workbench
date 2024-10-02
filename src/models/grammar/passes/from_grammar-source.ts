import { StringInputStream } from '../../../parser/stringInputStream';
import { GrammarLanguage } from '../model';
import { GrammarParser } from '../parser';

export class FromGrammarSoruce {
    transform(input: string): GrammarLanguage {
        const inputStream = new StringInputStream(input);
        const parser = new GrammarParser(inputStream);
        return parser.parse();
    }
}
