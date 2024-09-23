import { ModelLanguage, ProductType, Visitor } from '../model';
import { findFieldName } from '../util';

/*
    This pass assigns names to anonymous fields in ProductTypes.

    For example, given the following product type:

    ```ts
    {
        string;
        number;
    }
    ```

    It will be transformed into:

    ```ts
    {
        field1: string;
        field2: number;
    }
    ```

    The names are assigned using the `findFieldName` utility function,
    which likely generates appropriate names based on the field's type or position.
*/

export class AssignNameToAnonymousFields {
    transform(input: ModelLanguage): ModelLanguage {
        const visitor = new MyVisitor();
        for (const type of input.namedTypes.values()) {
            type.visit(visitor);
        }

        return input;
    }
}

class MyVisitor extends Visitor {
    postVisitProductType(type: ProductType): void {
        for (const field of type.fields) {
            field.name = findFieldName(field);
        }
    }
}
