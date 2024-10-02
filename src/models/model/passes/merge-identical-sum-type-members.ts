import { Model, Definition, SumType, Type, NamedTypeReference } from '../model';
import { Traverser, TraverseDelegate } from '../traverser';

export class MergeIdenticalSumTypeMembers implements TraverseDelegate {
    transform(input: Model): Model {
        const traverser = new Traverser(this);
        return traverser.visitModel(input);
    }

    visitDefinition(definition: Definition, traverser: Traverser): Definition {
        if (definition.type instanceof SumType) {
            definition.type = this.mergeSumTypeMembers(definition.type);
        }
        return definition;
    }

    private mergeSumTypeMembers(sumType: SumType): SumType {
        const uniqueMembers: Type[] = [];
        const seenMembers = new Set<string>();

        for (const member of sumType.members) {
            const memberKey = this.getTypeKey(member);
            if (!seenMembers.has(memberKey)) {
                uniqueMembers.push(member);
                seenMembers.add(memberKey);
            }
        }

        return new SumType(uniqueMembers);
    }

    private getTypeKey(type: Type): string {
        if (typeof type === 'string') {
            return type;
        } else if (this.isNamedTypeReference(type)) {
            return type.names.join('.');
        } else if (type instanceof SumType) {
            return `SumType(${type.members.map(this.getTypeKey).join(',')})`;
        } else if ('constructor' in type) {
            return `${type.constructor.name}(${JSON.stringify(type)})`;
        } else {
            return JSON.stringify(type);
        }
    }

    private isNamedTypeReference(type: Type): type is NamedTypeReference {
        return typeof type === 'object' && 'names' in type;
    }
}
