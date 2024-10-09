import { StringInputStream } from '../../../input/stringInputStream';
import { Grammar } from '../model';
import { GrammarParser } from './parser';

export class GrammarFromSource {
    transform(input: string): Grammar {
        const inputStream = new StringInputStream(input);
        const parser = new GrammarParser(inputStream, false);
        const grammar = parser.unwrap(parser.parseGrammar());
        parser.unwrap(parser.mustBeEOF());
        return grammar;
    }
}
