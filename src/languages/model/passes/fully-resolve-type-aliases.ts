import assert from 'assert';
import {
    ModelLanguage,
    NamedType,
    NamedTypeReference,
    PrimitiveType,
    ProductType,
    SumType,
    Type,
    Visitor
} from '../model';

/*
    This pass resolves type aliases by replacing NamedTypeReferences with their actual target types.

    For example, given the following structure:

    ```ts
    type A = string;
    type B = A;
    type C = B;
    ```

    After this pass, all references to B and C will be replaced with their underlying type, string.

    The purpose of this pass is to simplify the type structure by resolving all type aliases
    to their ultimate target types. This can help in further analysis and transformations
    by ensuring that all types are fully resolved.

    Note that this pass only handles simple type aliases. It does not modify complex types
    like ProductTypes or SumTypes, nor does it handle recursive type definitions.

    The transformation is done by visiting each NamedType in the ModelLanguage and
    replacing any NamedTypeReference with its target type.
*/

export class FullyResolveTypeAliases {
    transform(input: ModelLanguage): ModelLanguage {
        function resolveTypeAliases(namedType: NamedType): Type {
            let type = namedType.type;
            if (type instanceof NamedTypeReference) {
                return resolveTypeAliases(type.target);
            }
            return type;
        }
        for (const type of input.namedTypes.values()) {
            type.type = resolveTypeAliases(type);
        }
        return input;
    }
}
