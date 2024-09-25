import {
    Model,
    NamedTypeReference,
    ProductType,
    VisitResult,
    Visitor
} from '../model';

export class InlineDiscriminatedTypeWrappers {
    transform(input: Model): Model {
        const visitor = new MyVisitor();
        for (const type of input.namedTypes.values()) {
            type.type.visit(visitor);
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
