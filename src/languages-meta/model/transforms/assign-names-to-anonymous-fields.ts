import { Model, ProductType, ProductMember } from '../model';
import { Traverser, TraverseDelegate } from '../traverser';
import { findFieldName } from '../util';

export class AssignNameToAnonymousFields implements TraverseDelegate {
    transform(input: Model): Model {
        const traverser = new Traverser(this);
        return traverser.visitModel(input);
    }

    visitProductType(
        productType: ProductType,
        traverser: Traverser
    ): ProductType {
        const newMembers: ProductMember[] = productType.members.map(
            (member) => {
                if (!member.name) {
                    return {
                        ...member,
                        name: findFieldName(member)
                    };
                }
                return member;
            }
        );

        return new ProductType(newMembers);
    }
}
