import * as In from '../../parsed/model';
import * as Out from '../model';
import { Transformer } from '../transformer';

export class ResolvedModelFromParsedModel extends Transformer {
    constructor(public resolver: (fqn: string) => Out.Model) {
        super();
    }

    transform(input: In.Model): Out.Model {
        return this.transformModel(input);
    }

    transformModel(input: In.Model): Out.Model {
        if (input.parentName) console.log('        modifies', input.parentName.join('::'));

        const definitions = new Map<string, Out.Definition>();
        let parent = undefined;

        if (input.parentName) {
            parent = this.resolver(input.parentName.join('::'));
            for (const definition of parent.definitions) {
                definitions.set(definition.name, definition);
            }
        }

        for (const value of input.values) {
            switch (value.modelType) {
                case In.ModelType.Definition:
                    definitions.set(value.name, this.transformDefinition(value));
                    break;
                case In.ModelType.Deletion:
                    definitions.delete(value.name);
                    break;
                case In.ModelType.MemberModification:
                    let definition = definitions.get(value.name)!;
                    for (const modification of value.values) {
                        switch (modification.modelType) {
                            case In.ModelType.MemberAddition:
                                const addition = modification.value;
                                switch (addition.modelType) {
                                    case In.ModelType.ProductMember:
                                        switch (definition.type.modelType) {
                                            case Out.ModelType.ProductType:
                                                definition.type.members = definition.type.members.filter(
                                                    (m) => m.name !== addition.name
                                                );
                                                definition.type.members.push(this.transformProductMember(addition));
                                                break;
                                            default:
                                                throw new Error('Cannot add member to non-product type');
                                        }
                                        break;
                                    default:
                                        // In.ModelType.Type
                                        switch (definition.type.modelType) {
                                            case Out.ModelType.SumType:
                                                // TODO: Check that it is not duplicated
                                                definition.type.members.push(this.transformType(addition));
                                                break;
                                            default:
                                                throw new Error('Cannot add type to non-sum type');
                                        }
                                        break;
                                }
                                break;
                            default:
                                // In.ModelType.MemberDeletion
                                switch (definition.type.modelType) {
                                    case Out.ModelType.SumType:
                                        const priorLength = definition.type.members.length;
                                        definition.type.members = definition.type.members.filter(
                                            (m) =>
                                                m.modelType === Out.ModelType.NamedTypeReference &&
                                                m.names.length == 1 &&
                                                m.names[0] !== modification.name
                                        );
                                        if (priorLength === definition.type.members.length) {
                                            throw new Error('Could not delete member from sum type');
                                        }
                                        break;
                                    case Out.ModelType.ProductType:
                                        definition.type.members = definition.type.members.filter(
                                            (m) => m.name !== modification.name
                                        );
                                        if (definition.type.members.length === 0) {
                                            throw new Error('Could not delete member from product type');
                                        }
                                        break;
                                    default:
                                        throw new Error('Cannot delete member from non-product or sum type');
                                }
                                break;
                        }
                    }
                    break;
            }
        }

        return new Out.Model(
            input.name,
            parent,
            [...definitions.values()].sort((a, b) => a.name.localeCompare(b.name))
        );
    }
}
