import { ModelLanguage, NamedTypeReference, ProductType } from '../model';

/*
    This pass denests wrapper types by removing unnecessary nesting.

    For example, given the following nested structure:

    ```ts
    type Outer = {
        inner: Inner;
    };

    type Inner = {
        field1: string;
        field2: number;
    };
    ```

    It will be transformed into:

    ```ts
    type Outer = {
        field1: string;
        field2: number;
    };
    ```

    This pass only applies to ProductTypes with a single field that references
    another ProductType. The inner ProductType replaces the outer one, effectively
    flattening the structure.
*/

export class DenestWrappers {
    transform(input: ModelLanguage): ModelLanguage {
        for (const namedType of input.namedTypes.values()) {
            let type = namedType.type;
            if (type.isWrapperProductType()) {
                const field = type.fields[0];
                if (field.type instanceof NamedTypeReference) {
                    if (field.type.target.type instanceof ProductType) {
                        namedType.type = field.type.target.type;
                    }
                }
            }
        }

        return input;
    }
}
