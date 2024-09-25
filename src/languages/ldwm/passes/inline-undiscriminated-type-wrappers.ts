import {
    CountedType,
    Model,
    ProductType,
    Type,
    VisitResult,
    Visitor
} from '../model';

export class InlineUndiscriminatedTypeWrappers {
    transform(input: Model): Model {
        const visitor = new MyVisitor();
        for (const type of input.namedTypes.values()) {
            type.visit(visitor);
        }

        return input;
    }
}

class MyVisitor extends Visitor {
    unwrapUndiscriminatedWrapper(type: Type): Type {
        if (type.isWrapperProductType()) return type.fields[0].type;
        return type;
    }
    postVisitCountedType(type: CountedType): VisitResult {
        type.elementType = this.unwrapUndiscriminatedWrapper(type.elementType);
    }
    postVisitProductType(type: ProductType): VisitResult {
        for (const field of type.fields) {
            field.type = this.unwrapUndiscriminatedWrapper(field.type);
        }
    }
}
