import { Model, ProductType, ProductMember } from '../new-model';
import { Traverser, TraverseDelegate } from '../new-traverser';
import { findFieldName } from '../new-util';

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
