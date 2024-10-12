import * as In from '../../parsed/model';
import * as Out from '../model';
import { Transformer } from '../transformer';

export class ResolvedModelFromParsedModel extends Transformer {
    constructor(public resolver: (fqn: string) => Out.Model) {
        super();
    }

    transform(input: In.Model): Out.Model {
        return this.transformModel(input);
    }

    transformModel(input: In.Model): Out.Model {
        if (input.parentName) console.log('        modifies', input.parentName.join('::'));
        const result = new Out.Model(
            input.name,
            input.parentName ? this.resolver(input.parentName.join('::')) : undefined,
            input.values.filter((v) => In.isDefinition(v)).map((d) => this.transformDefinition(d))
        );
        return result;
    }
}
