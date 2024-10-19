import * as Model from './model';

export function simplifiedType(type: Model.Type, grammar: Model.Model): Model.Type {
    switch (type.discriminator) {
        case Model.Discriminator.SumType:
            if (type.members.length === 1) {
                return simplifiedType(type.members[0], grammar);
            }
            break;
        case Model.Discriminator.ProductType:
            if (type.members.length === 1) {
                return simplifiedType(type.members[0].type, grammar);
            } else {
                return new Model.ProductType({
                    members: type.members.map(
                        (m) => new Model.ProductMember({ name: m.name, type: simplifiedType(m.type, grammar) })
                    )
                });
            }
            break;
        case Model.Discriminator.NamedTypeReference:
            if (type.fqn.length === 1) {
                const definition = grammar.definitions.get(type.fqn[0]);
                if (definition && !Model.isSumType(definition.type)) {
                    return simplifiedType(definition.type, grammar);
                }
            }
            break;
        case Model.Discriminator.OptionType:
            return new Model.OptionType({ type: simplifiedType(type.type, grammar) });
        case Model.Discriminator.TupleType:
            return new Model.TupleType({ members: type.members.map((m) => simplifiedType(m, grammar)) });
        case Model.Discriminator.MapType:
            return new Model.MapType({
                keyType: simplifiedType(type.keyType, grammar),
                valueType: simplifiedType(type.valueType, grammar)
            });
        case Model.Discriminator.SetType:
            return new Model.SetType({ keyType: simplifiedType(type.keyType, grammar) });
        case Model.Discriminator.SequenceType:
            return new Model.SequenceType({ elementType: simplifiedType(type.elementType, grammar) });
        default:
            break;
    }
    return type;
}
