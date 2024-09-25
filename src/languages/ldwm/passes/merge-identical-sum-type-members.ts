import { Model, Visitor as ModelVisitor, SumType, VisitResult } from '../model';
import { typesAreEqual } from '../util';

/*

    This pass modifies SumTypes by merging identical members.

    For example, given the following sum type:

    ```ts
    X | Y | X;
    ```

    It will be transformed into:

    ```ts
    X | Y;
    ```
    
    If the sum type ends up with just one member, it will be inlined into any type that references it.

*/

export class MergeIdenticalSumTypeMembers {
    transform(input: Model): Model {
        const visitor = new Visitor();
        for (const type of input.namedTypes.values()) {
            type.visit(visitor);
        }

        return input;
    }
}

class Visitor extends ModelVisitor {
    postVisitSumType(type: SumType): VisitResult {
        let i = 0;
        while (i < type.members.length) {
            for (let j = i + 1; j < type.members.length; j++) {
                if (typesAreEqual(type.members[i], type.members[j])) {
                    type.members.splice(j, 1);
                    j--; // adjust the index of the next field to test
                }
            }
            i++;
        }

        if (type.members.length === 1) return type.members[0];
    }
}
