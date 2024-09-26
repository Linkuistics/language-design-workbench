import { Model, Definition, NamedTypeReference, Type } from '../new-model';
import { Traverser, TraverseDelegate } from '../new-traverser';

export class FullyResolveTypeAliases implements TraverseDelegate {
    private resolvedTypes: Map<string, Type> = new Map();
    private currentlyResolving: Set<string> = new Set();

    transform(input: Model): Model {
        this.resolvedTypes.clear();
        this.currentlyResolving.clear();
        const traverser = new Traverser(this);
        return traverser.visitModel(input);
    }

    visitDefinition(definition: Definition, traverser: Traverser): Definition {
        definition.type = this.resolveType(definition.type, traverser);
        this.resolvedTypes.set(definition.name, definition.type);
        return definition;
    }

    visitNamedTypeReference(
        reference: NamedTypeReference,
        traverser: Traverser
    ): NamedTypeReference {
        const name = reference.names.join('.');
        if (this.currentlyResolving.has(name)) {
            // Circular reference detected, return the original reference
            return reference;
        }

        const resolvedType = this.resolvedTypes.get(name);
        if (resolvedType) {
            return this.createNamedTypeReference(resolvedType);
        }

        this.currentlyResolving.add(name);
        const definition = this.findDefinition(
            traverser.visitModel(traverser.delegate as any) as Model,
            name
        );
        if (definition) {
            const resolvedType = this.resolveType(definition.type, traverser);
            this.resolvedTypes.set(name, resolvedType);
            this.currentlyResolving.delete(name);
            return this.createNamedTypeReference(resolvedType);
        }
        this.currentlyResolving.delete(name);
        return reference;
    }

    private resolveType(type: Type, traverser: Traverser): Type {
        if (this.isNamedTypeReference(type)) {
            return this.visitNamedTypeReference(type, traverser)
                .names[0] as Type;
        }
        return type;
    }

    private findDefinition(model: Model, name: string): Definition | undefined {
        return model.values.find(
            (value) => value instanceof Definition && value.name === name
        ) as Definition | undefined;
    }

    private isNamedTypeReference(type: Type): type is NamedTypeReference {
        return typeof type === 'object' && 'names' in type;
    }

    private createNamedTypeReference(type: Type): NamedTypeReference {
        if (this.isNamedTypeReference(type)) {
            return type;
        }
        return { names: [type as string] };
    }
}
