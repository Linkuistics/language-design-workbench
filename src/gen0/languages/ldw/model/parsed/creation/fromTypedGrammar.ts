import { Definition, Model } from '../model';
import { Grammar } from '../../../grammar/typed/model';

export class ParsedModelFromTypedGrammar {
    transform(input: Grammar): Model {
        return new Model(input.name, undefined, [
            ...input.rules.map((r) => new Definition(r.name, r.type)),
            // ...input.prattRules.map(r => new Definition(r.name, r.type)),
            ...input.definitions
        ]);
    }
}
