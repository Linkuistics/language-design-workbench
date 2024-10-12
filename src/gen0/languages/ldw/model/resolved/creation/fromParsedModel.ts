import * as In from '../../parsed/model';
import * as Out from '../model';
import { Transformer } from '../transformer';

export class ResolvedModelFromParsedModel extends Transformer {
    transform(input: In.Model): Out.Model {
        return this.transformModel(input);
    }

    transformModel(input: In.Model): Out.Model {
        return new Out.Model(
            input.name,
            undefined,
            input.values.filter((v) => In.isDefinition(v)).map((d) => this.transformDefinition(d))
        );
    }
}
