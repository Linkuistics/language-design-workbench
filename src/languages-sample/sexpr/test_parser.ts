import { SexprParser } from './input/parser';
import { readFileSync } from 'fs';
import { StringInputStream } from '../../input/stringInputStream';
import { ParseError } from '../../input/parseError';

const sampleContent = readFileSync('src/languages/sexpr/sample.sexpr', 'utf-8');
const parser = new SexprParser(new StringInputStream(sampleContent));

try {
    const result = parser.parse();
    console.log(JSON.stringify(result, null, 2));
    console.log('Parsing successful!');
} catch (error) {
    if (error instanceof ParseError) {
        console.error('Parse error:', error.toString());
    } else {
        console.error('Unexpected error:', error);
    }
}
