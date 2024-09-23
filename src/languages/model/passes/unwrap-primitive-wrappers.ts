import assert from 'assert';
import {
    ModelLanguage,
    NamedType,
    NamedTypeReference,
    PrimitiveType,
    ProductType,
    SumType,
    Visitor
} from '../model';

/*
    This pass unwraps primitive wrappers by replacing them with their underlying primitive types,
    except when they are used in sum types for discrimination.

    For example, given the following structure:

    ```ts
    type StringWrapper = {
        value: string;
    };

    type NumberWrapper = {
        value: number;
    };

    type SimpleWrapper = {
        value: boolean;
    };

    type Example = StringWrapper | NumberWrapper;
    ```

    It will be transformed into:

    ```ts
    type StringWrapper = {
        value: string;
    };

    type NumberWrapper = {
        value: number;
    };

    type SimpleWrapper = boolean;

    type Example = StringWrapper | NumberWrapper;
    ```

    This pass identifies ProductTypes that have a single field of a PrimitiveType.
    These are considered "primitive wrappers" and are replaced with their underlying primitive type,
    but only if they are not used in a SumType (union type).

    Primitive wrappers used in SumTypes are not unwrapped to preserve type discrimination capabilities.

    The purpose of this pass is to simplify the type structure by removing unnecessary
    wrappers around primitive types, while still maintaining type safety and discrimination
    where needed.
*/

export class UnwrapPrimitiveWrappers {
    transform(input: ModelLanguage): ModelLanguage {
        const primitiveWrappers = new Map<string, NamedType>();

        // Identify primitive wrappers
        for (const type of input.namedTypes.values()) {
            if (
                type.type.isWrapperProductType() &&
                type.type.fields[0].type instanceof PrimitiveType
            ) {
                primitiveWrappers.set(type.name, type);
            }
        }

        // Remove primitive wrappers that are used in sum types
        {
            const visitor = new RemovePrimitiveWrappersNeedingDiscrimination(
                primitiveWrappers
            );
            for (const type of input.namedTypes.values()) {
                type.visit(visitor);
            }
        }

        // Unwrap the remaining primitive wrappers
        {
            for (const type of primitiveWrappers.values()) {
                assert(type.type instanceof ProductType);
                type.type = type.type.fields[0].type;
            }
        }

        return input;
    }
}

class RemovePrimitiveWrappersNeedingDiscrimination extends Visitor {
    constructor(public simpleStructs: Map<string, NamedType>) {
        super();
    }

    postVisitSumType(type: SumType): void {
        for (const member of type.members) {
            if (member instanceof NamedTypeReference)
                this.simpleStructs.delete(member.target.name);
        }
    }
}
