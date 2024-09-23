import pluralize from 'pluralize';
import {
    ArrayType,
    ModelLanguage,
    ProductType,
    Visitor as TypeModelVisitor
} from '../model';

/*
    This pass pluralizes the names of array fields in product types.

    For example, given the following structure:

    ```ts
    type Example = {
        user: Array<User>;
        item: Array<Item>;
        category: string;
    };
    ```

    It will be transformed into:

    ```ts
    type Example = {
        users: Array<User>;
        items: Array<Item>;
        category: string;
    };
    ```

    This pass only affects fields that are of ArrayType. It uses the 'pluralize'
    library to generate the plural form of the field name.

    The purpose of this pass is to improve the readability and consistency
    of the model by ensuring that array field names are always in plural form,
    which is a common convention in many programming languages and APIs.
*/

export class PluralizeArrayFields {
    transform(input: ModelLanguage): ModelLanguage {
        const visitor = new Visitor();
        for (const type of input.namedTypes.values()) {
            type.visit(visitor);
        }

        return input;
    }
}

class Visitor extends TypeModelVisitor {
    postVisitProductType(type: ProductType): void {
        for (const field of type.fields) {
            if (field.type instanceof ArrayType)
                field.name = pluralize(field.name);
        }
    }
}
