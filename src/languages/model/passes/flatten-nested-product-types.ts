import {
    ArrayType,
    CountedType,
    ModelLanguage,
    OptionalType,
    ProductType,
    ProductTypeField,
    Visitor
} from '../model';
import { findFieldName, isNameAnonymous } from '../util';

/*
    This pass flattens nested product types by merging fields from inner product types
    into the outer product type.

    For example, given the following nested structure:

    ```ts
    type Outer = {
        field1: string;
        inner: {
            field2: number;
            field3: boolean;
        };
    };
    ```

    It will be transformed into:

    ```ts
    type Outer = {
        field1: string;
        inner_field2: number;
        inner_field3: boolean;
    };
    ```

    This pass can handle nested product types within array and optional types.
    It also preserves the optionality and array nature of the outer field when flattening.

    The `onlyAnonymousFields` parameter controls whether all fields are flattened
    or only anonymous fields.
*/

export class FlattenNestedProductTypes {
    constructor(public onlyAnonymousFields: boolean) {}

    transform(input: ModelLanguage): ModelLanguage {
        const visitor = new MyVisitor(this.onlyAnonymousFields);
        for (const type of input.namedTypes.values()) {
            type.visit(visitor);
        }

        return input;
    }
}

class MyVisitor extends Visitor {
    constructor(public onlyAnonymousFields: boolean) {
        super();
    }

    postVisitProductType(type: ProductType): void {
        // TODO: look through array and optional types
        type.fields = type.fields.flatMap((outerField) => {
            const outerFieldIsAnonymous = isNameAnonymous(outerField.name);
            if (outerFieldIsAnonymous || !this.onlyAnonymousFields) {
                let target = outerField.type;
                let targetIsOptional = false;
                let targetIsArray = false;
                if (target instanceof ArrayType) {
                    target = target.elementType;
                    targetIsArray = true;
                } else if (target instanceof OptionalType) {
                    target = target.elementType;
                    targetIsOptional = true;
                }
                if (target instanceof ProductType) {
                    return target.fields.map((field) => {
                        const name = findFieldName(field);
                        const newName = outerFieldIsAnonymous
                            ? name
                            : `${outerField.name}_${name}`;
                        let newType = field.type;
                        if (targetIsArray) {
                            newType = new ArrayType(newType);
                        } else if (
                            targetIsOptional &&
                            !(newType instanceof CountedType)
                        ) {
                            newType = new OptionalType(newType);
                        }
                        return new ProductTypeField(newName, newType);
                    });
                }
            }
            return [outerField];
        });
    }
}
