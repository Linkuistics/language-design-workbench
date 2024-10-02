import { Model, NamedTypeReference, Definition } from '../model';
import { Traverser, TraverseDelegate } from '../traverser';

export class RemoveUnreferencedTypes implements TraverseDelegate {
    private referencedTypes: Set<string> = new Set();
    private currentModel: Model | null = null;

    constructor(public rootTypeNames: string[]) {}

    transform(input: Model): Model {
        this.referencedTypes = new Set(this.rootTypeNames);
        this.referencedTypes.add('trivia');
        this.currentModel = input;

        const traverser = new Traverser(this);
        const updatedModel = traverser.visitModel(input);

        // Remove unreferenced types
        updatedModel.values = updatedModel.values.filter((value) => {
            if (value instanceof Definition) {
                return this.referencedTypes.has(value.name);
            }
            return true;
        });

        this.currentModel = null;
        return updatedModel;
    }

    visitModel(model: Model, traverser: Traverser): Model {
        this.currentModel = model;
        model.values.forEach((value) => {
            if (value instanceof Definition) {
                traverser.visitDefinition(value);
            }
        });
        return model;
    }

    visitNamedTypeReference(
        namedTypeReference: NamedTypeReference,
        traverser: Traverser
    ): NamedTypeReference {
        const typeName = namedTypeReference.names.join('.');
        if (!this.referencedTypes.has(typeName)) {
            this.referencedTypes.add(typeName);
            // Find and traverse the referenced type
            if (this.currentModel) {
                const referencedType = this.findDefinition(
                    this.currentModel,
                    typeName
                );
                if (referencedType) {
                    traverser.visitDefinition(referencedType);
                }
            }
        }
        return namedTypeReference;
    }

    private findDefinition(model: Model, name: string): Definition | undefined {
        return model.values.find(
            (value) => value instanceof Definition && value.name === name
        ) as Definition | undefined;
    }
}
