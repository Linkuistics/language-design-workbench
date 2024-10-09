import {
    Model,
    Definition,
    ProductType,
    NamedTypeReference,
    Type
} from '../model';
import { Traverser, TraverseDelegate } from '../traverser';

export class DenestWrappers implements TraverseDelegate {
    transform(input: Model): Model {
        const traverser = new Traverser(this);
        return traverser.visitModel(input);
    }

    visitDefinition(definition: Definition, traverser: Traverser): Definition {
        if (
            definition.type instanceof ProductType &&
            definition.type.members.length === 1
        ) {
            const member = definition.type.members[0];
            if (this.isNamedTypeReference(member.type)) {
                const referencedType = this.findDefinition(
                    traverser.visitModel(traverser.delegate as any) as Model,
                    member.type.names.join('.')
                );
                if (
                    referencedType &&
                    referencedType.type instanceof ProductType
                ) {
                    definition.type = referencedType.type;
                }
            }
        }
        return definition;
    }

    private findDefinition(model: Model, name: string): Definition | undefined {
        return model.values.find(
            (value) => value instanceof Definition && value.name === name
        ) as Definition | undefined;
    }

    private isNamedTypeReference(type: Type): type is NamedTypeReference {
        return typeof type === 'object' && 'names' in type;
    }
}
