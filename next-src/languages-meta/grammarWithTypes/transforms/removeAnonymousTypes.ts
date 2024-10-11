import {
    Definition,
    EnumType,
    NamedTypeReference,
    ProductType,
    SumType,
    Type,
    TypeWithStructure
} from '../../model/model';
import {
    TraversalEngine as ModelTraversalEngine,
    TraversalDelegate as ModelTraverseDelegate,
    Traverser as ModelTraverser
} from '../../model/traverser';
import { Grammar } from '../model';

export class RemoveAnonymousTypes {
    transform(input: Grammar): Grammar {
        for (const rule of input.rules) {
            const typeRemover = new TypeRemover(rule.name);
            new ModelTraversalEngine(typeRemover).visitType(rule.type);
            input.definitions.push(...typeRemover.definitions);
        }
        return input;
    }
}

class TypeRemover implements ModelTraverseDelegate {
    public definitions: Definition[] = [];
    public depth: number = 0;

    constructor(private baseName: string) {}

    visitTypeWithStructure(typeWithStructure: TypeWithStructure, traverser: ModelTraverser): void {
        this.depth++;
        traverser.next();
        this.depth--;
    }

    visitEnumType(enumType: EnumType, traverser: ModelTraverser): void | Type {
        if (this.depth > 1) {
            let name = `${this.baseName}_${this.definitions.length}`;
            this.definitions.push(new Definition(name, enumType));
            return new NamedTypeReference([name]);
        }
        traverser.next();
    }

    visitSumType(sumType: SumType, traverser: ModelTraverser): void | Type {
        if (this.depth > 1) {
            console.log('Removing internal SumType', this.baseName, sumType);
            let name = `${this.baseName}_${this.definitions.length}`;
            this.definitions.push(new Definition(name, sumType));
            return new NamedTypeReference([name]);
        }
        traverser.next();
    }

    visitProductType(productType: ProductType, traverser: ModelTraverser): void | Type {
        traverser.next();
        if (this.depth > 1) {
            let name = `${this.baseName}_${this.definitions.length}`;
            this.definitions.push(new Definition(name, productType));
            return new NamedTypeReference([name]);
        }
        traverser.next();
    }
}
