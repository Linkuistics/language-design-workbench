import { StringInputStream } from '../../../parser/stringInputStream';
import { Model } from '../model';
import { ModelParser } from '../parser';

export class FromModelSource {
    transform(input: string): Model {
        const inputStream = new StringInputStream(input);
        const parser = new ModelParser(inputStream);
        return parser.parse();
    }
}
