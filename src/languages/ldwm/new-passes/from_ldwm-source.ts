import { StringInputStream } from '../../../parser/stringInputStream';
import { Model } from '../new-model';
import { LDWMParser } from '../new-parser';

export class FromLDWMSource {
    transform(input: string): Model {
        const inputStream = new StringInputStream(input);
        const parser = new LDWMParser(inputStream);
        return parser.parse();
    }
}
