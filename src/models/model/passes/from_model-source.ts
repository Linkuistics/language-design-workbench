import { ParseError } from '../../../parser/parseError';
import { StringInputStream } from '../../../parser/stringInputStream';
import { Model } from '../model';
import { ModelParser } from '../parser';

export class FromModelSource {
    transform(input: string): Model {
        const inputStream = new StringInputStream(input);
        const parser = new ModelParser(inputStream);
        let model = parser.unwrap(parser.parseModel());
        parser.unwrap(parser.mustBeEOF());
        return model;
    }
}
