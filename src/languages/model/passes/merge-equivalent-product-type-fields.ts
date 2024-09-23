import {
    ArrayType,
    ModelLanguage,
    Visitor as ModelVisitor,
    ProductType,
    Type,
    CountedType
} from '../model';
import { typesAreEqual } from '../util';

/*
    This pass merges equivalent fields in product types, combining fields
    with the same name into a single array field.

    For example, given the following structure:

    ```ts
    type Example = {
        field1: string;
        field1: string;
        field2: number;
        field2: Array<number>;
    };
    ```

    It will be transformed into:

    ```ts
    type Example = {
        field1: Array<string>;
        field2: Array<number>;
    };
    ```

    This pass handles the following cases:
    1. Merging fields with the same name and type into an array
    2. Merging a single field with an array of the same type
    3. Merging optional fields with non-optional fields

    The resulting merged field will always be an array type, preserving
    the base type of the original fields.
*/

export class MergeEquivalentProductTypeFields {
    transform(input: ModelLanguage): ModelLanguage {
        const visitor = new Visitor();
        for (const type of input.namedTypes.values()) {
            type.visit(visitor);
        }

        return input;
    }
}

class Visitor extends ModelVisitor {
    postVisitProductType(type: ProductType): void {
        // Merge fields of X, Array<X>, Optional<X> into Array<X>

        function mergeTypes(t1: Type, t2: Type) {
            // Unwrap the base types if they are CountedTypes, because we want to merge
            // their contents into an ArrayType
            const baseType1 = t1 instanceof CountedType ? t1.elementType : t1;
            const baseType2 = t2 instanceof CountedType ? t2.elementType : t2;
            return typesAreEqual(baseType1, baseType2)
                ? new ArrayType(baseType1)
                : undefined;
        }

        let i = 0;
        while (i < type.fields.length) {
            for (let j = i + 1; j < type.fields.length; j++) {
                if (type.fields[i].name === type.fields[j].name) {
                    let mergedType = mergeTypes(
                        type.fields[i].type,
                        type.fields[j].type
                    );
                    if (mergedType) {
                        type.fields[i].type = mergedType;
                        type.fields.splice(j, 1);
                        j--; // adjust the index of the next field to merge
                    }
                }
            }
            i++;
        }
    }
}
