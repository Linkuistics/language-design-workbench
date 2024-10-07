import { Definition, Model } from '../../model/model';
import { Grammar } from '../model';

export class ToModel {
    transform(input: Grammar): Model {
        return new Model(input.name, undefined, [
            ...input.definitions,
            ...input.rules.map((r) => new Definition(r.name, r.type))
            // ...input.prattRules.map(r => new Definition(r.name, r.type)),
        ]);
    }
}
