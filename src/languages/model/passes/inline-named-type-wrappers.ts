import {
    ModelLanguage,
    NamedTypeReference,
    ProductType,
    VisitResult,
    Visitor,
    SumType,
    NamedType
} from '../model';

/*
    This pass inlines named type wrappers by replacing them with their underlying types,
    but only if the underlying type is discriminated (e.g., a SumType with all discriminated members or a ProductType).

    For example, given the following structure:

    ```ts
    const innerType = new NamedType('innertype', new SumType([
        // ... some discriminated type members ...
    ]));

    const wrapperType = new NamedType('wrapper', new ProductType([
        new ProductTypeField('innertype', new NamedTypeReference(innerType))
    ]));
    ```

    It will be transformed into:

    ```ts
    const wrapperType = new NamedType('wrapper', new SumType([
        // ... the same discriminated type members as in innerType ...
    ]));
    ```

    This pass applies to ProductTypes that are wrapper types (i.e., have a single field) where:
    1. The field type is a NamedTypeReference
    2. The field name matches the name of the referenced type
    3. The referenced type is discriminated

    The transformation replaces the wrapper type (ProductType) with the referenced type 
    only if all these conditions are met.

    Note: The isDiscriminated() method returns true for ProductTypes and SumTypes whose 
    members are all discriminated. This means the inlining can occur for wrappers of 
    ProductTypes or "fully discriminated" SumTypes.
*/

export class InlineNamedTypeWrappers {
    transform(input: ModelLanguage): ModelLanguage {
        const visitor = new MyVisitor();
        for (const type of input.namedTypes.values()) {
            type.visit(visitor);
        }

        return input;
    }
}

class MyVisitor extends Visitor {
    postVisitProductType(type: ProductType): VisitResult {
        if (type.fields.length === 1) {
            const field = type.fields[0];
            if (
                field.type instanceof NamedTypeReference &&
                // Don't do this if the name was explicitly specified
                field.type.target.name === field.name &&
                field.type.target.type.isDiscriminated()
            ) {
                return field.type;
            }
        }
    }
}
