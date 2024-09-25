import {
    Model,
    NamedTypeReference,
    ProductType,
    VisitResult,
    Visitor
} from '../model';

/*
    This pass removes types that are not referenced from the root types or the
    'trivia' type.

    The process works as follows:
    1. Start with a set of root type names provided to the constructor.
    2. Add 'trivia' to this set of referenced types.
    3. Traverse the type hierarchy starting from the root types and 'trivia'.
    4. For each NamedTypeReference encountered, mark the referenced type as used.
    5. After traversal, remove all types from the ModelLanguage that were not marked as used.

    This pass helps to clean up the type definitions by removing types that are
    not part of the main type hierarchy, reducing clutter and potential
    confusion in the generated output.
*/

export class RemoveUnreferencedTypes {
    constructor(public rootTypeNames: string[]) {}

    transform(input: Model): Model {
        const nameSet = new Set<string>();
        const visitor = new MyVisitor(nameSet);
        for (const name of this.rootTypeNames) {
            nameSet.add(name);
            input.namedTypes.get(name)!.visit(visitor);
        }
        nameSet.add('trivia');
        input.namedTypes.get('trivia')?.visit(visitor);
        for (const name of input.namedTypes.keys()) {
            if (!nameSet.has(name)) {
                input.namedTypes.delete(name);
            }
        }

        return input;
    }
}

class MyVisitor extends Visitor {
    constructor(public nameSet: Set<string> = new Set()) {
        super();
    }

    visitNamedTypeReference(type: NamedTypeReference): VisitResult {
        if (this.nameSet.has(type.target.name)) return;
        this.nameSet.add(type.target.name);
        type.target.visit(this);
    }
}
