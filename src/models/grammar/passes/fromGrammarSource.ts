import { StringInputStream } from '../../../parser/stringInputStream';
import { Grammar } from '../model';
import { GrammarParser } from '../parser';

export class FromGrammarSource {
    transform(input: string): Grammar {
        const inputStream = new StringInputStream(input);
        const parser = new GrammarParser(inputStream);
        const grammar = parser.parseGrammar();
        parser.mustBeEOF();
        return grammar;
    }
}
