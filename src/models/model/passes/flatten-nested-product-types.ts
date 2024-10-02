import {
    Model,
    ProductType,
    SequenceType,
    OptionType,
    Type,
    ProductMember
} from '../model';
import { Traverser, TraverseDelegate } from '../traverser';
import { findFieldName } from '../util';

export class FlattenNestedProductTypes implements TraverseDelegate {
    constructor(public onlyAnonymousFields: boolean) {}

    transform(input: Model): Model {
        const traverser = new Traverser(this);
        return traverser.visitModel(input);
    }

    visitProductType(
        productType: ProductType,
        traverser: Traverser
    ): ProductType {
        const newMembers: ProductMember[] = [];

        for (const outerMember of productType.members) {
            const outerMemberIsAnonymous = !outerMember.name;
            if (outerMemberIsAnonymous || !this.onlyAnonymousFields) {
                let target = outerMember.type;
                let targetIsOptional = false;
                let targetIsSequence = false;

                if (target instanceof SequenceType) {
                    target = target.elementType;
                    targetIsSequence = true;
                } else if (target instanceof OptionType) {
                    target = target.type;
                    targetIsOptional = true;
                }

                if (target instanceof ProductType) {
                    for (const innerMember of target.members) {
                        const name = findFieldName(innerMember);
                        const newName = outerMemberIsAnonymous
                            ? name
                            : `${outerMember.name}_${name}`;
                        let newType = innerMember.type;
                        if (targetIsSequence) {
                            newType = new SequenceType(newType);
                        } else if (targetIsOptional) {
                            newType = new OptionType(newType);
                        }
                        newMembers.push({ name: newName, type: newType });
                    }
                } else {
                    newMembers.push(outerMember);
                }
            } else {
                newMembers.push(outerMember);
            }
        }

        return new ProductType(newMembers);
    }
}
