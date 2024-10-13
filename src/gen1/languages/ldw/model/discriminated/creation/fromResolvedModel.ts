import * as In from '../../resolved/model';
import * as Out from '../model';
import { Transformer } from '../transformer';

export class DiscriminatedModelFromResolvedModel extends Transformer {
    transform(input: In.Model): Out.Model {
        return this.transformModel(input);
    }
}
