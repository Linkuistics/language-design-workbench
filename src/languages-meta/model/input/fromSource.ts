import { StringInputStream } from '../../../input/stringInputStream';
import { Model } from '../model';
import { ModelParser } from './parser';

export class ModelFromSource {
    transform(input: string): Model {
        const inputStream = new StringInputStream(input);
        const parser = new ModelParser(inputStream);
        let model = parser.unwrap(parser.parseModel());
        parser.unwrap(parser.mustBeEOF());
        return model;
    }
}
