import {
    Definition,
    EnumType,
    MapType,
    Model,
    NamedTypeReference,
    OptionType,
    PrimitiveType,
    ProductMember,
    ProductType,
    SequenceType,
    SetType,
    SumType,
    TupleType,
    Type,
    VoidType
} from './model';

export function baseType(type: Type): Type {
    if (type instanceof SequenceType) {
        return type.elementType;
    } else if (type instanceof OptionType) {
        return baseType(type.type);
    }
    return type;
}

export function findFieldName(field: ProductMember): string {
    if (field.name) {
        return field.name;
    }

    const typeName = field.type.constructor.name;
    return `${typeName.toLowerCase()}Field`;
}

export function typesAreEqual(type1: Type, type2: Type, debug: boolean = false): boolean {
    const checkAndLog = (condition: boolean, message: string): boolean => {
        if (debug && !condition) {
            console.log(message);
        }
        return condition;
    };

    // Helper function to get the type name
    const getTypeDiscriminator = (type: Type): string => {
        if (type instanceof PrimitiveType) return 'PrimitiveType';
        if (type instanceof VoidType) return 'VoidType';
        if (type instanceof EnumType) return 'EnumType';
        if (type instanceof SumType) return 'SumType';
        if (type instanceof ProductType) return 'ProductType';
        if (type instanceof TupleType) return 'TupleType';
        if (type instanceof MapType) return 'MapType';
        if (type instanceof SetType) return 'SetType';
        if (type instanceof SequenceType) return 'SequenceType';
        if (type instanceof OptionType) return 'OptionType';
        if (type instanceof NamedTypeReference) return 'NamedTypeReference';
        return 'Unknown';
    };

    const typeDiscriminator1 = getTypeDiscriminator(type1);
    const typeDiscriminator2 = getTypeDiscriminator(type2);

    if (
        !checkAndLog(
            typeDiscriminator1 === typeDiscriminator2,
            `Type mismatch: ${typeDiscriminator1} vs ${typeDiscriminator2}`
        )
    ) {
        return false;
    }

    switch (typeDiscriminator1) {
        case 'VoidType':
            return true;
        case 'PrimitiveType':
            return checkAndLog(type1 === type2, `Primitive type mismatch: ${type1} vs ${type2}`);
        case 'EnumType':
            return checkAndLog(
                JSON.stringify((type1 as EnumType).members) === JSON.stringify((type2 as EnumType).members),
                `Enum members mismatch: ${JSON.stringify((type1 as EnumType).members)} vs ${JSON.stringify((type2 as EnumType).members)}`
            );
        case 'SumType':
            return (type1 as SumType).members.every((m, i) =>
                checkAndLog(
                    typesAreEqual(m, (type2 as SumType).members[i], debug),
                    `Sum type member mismatch at index ${i}`
                )
            );
        case 'ProductType':
            return (type1 as ProductType).members.every((m, i) =>
                checkAndLog(
                    m.name === (type2 as ProductType).members[i].name &&
                        typesAreEqual(m.type, (type2 as ProductType).members[i].type, debug),
                    `Product type member mismatch at index ${i}: ${m.name} vs ${(type2 as ProductType).members[i].name}`
                )
            );
        case 'TupleType':
            return (type1 as TupleType).members.every((m, i) =>
                checkAndLog(
                    typesAreEqual(m, (type2 as TupleType).members[i], debug),
                    `Tuple type member mismatch at index ${i}`
                )
            );
        case 'MapType':
            const mapType1 = type1 as MapType;
            const mapType2 = type2 as MapType;
            const keyEqual = typesAreEqual(mapType1.keyType, mapType2.keyType, debug);
            const valueEqual = typesAreEqual(mapType1.valueType, mapType2.valueType, debug);
            return checkAndLog(keyEqual, `Map key type mismatch`) && checkAndLog(valueEqual, `Map value type mismatch`);
        case 'SetType':
            return checkAndLog(
                typesAreEqual((type1 as SetType).keyType, (type2 as SetType).keyType, debug),
                `Set key type mismatch`
            );
        case 'SequenceType':
            return checkAndLog(
                typesAreEqual((type1 as SequenceType).elementType, (type2 as SequenceType).elementType, debug),
                `Sequence element type mismatch`
            );
        case 'OptionType':
            return checkAndLog(
                typesAreEqual((type1 as OptionType).type, (type2 as OptionType).type, debug),
                `Option type mismatch`
            );
        case 'NamedTypeReference':
            return checkAndLog(
                JSON.stringify((type1 as NamedTypeReference).names) ===
                    JSON.stringify((type2 as NamedTypeReference).names),
                `Named type reference mismatch: ${JSON.stringify((type1 as NamedTypeReference).names)} vs ${JSON.stringify((type2 as NamedTypeReference).names)}`
            );
        default:
            checkAndLog(false, `Unhandled type comparison: ${typeDiscriminator1}`);
            checkAndLog(false, `${JSON.stringify(type1, null, 2)} vs ${JSON.stringify(type2, null, 2)}`);
            return false;
    }
}

export function modelsAreEqual(model1: Model, model2: Model, debug: boolean = false): boolean {
    const checkAndLog = (condition: boolean, message: string): boolean => {
        if (debug && !condition) {
            console.log(message);
        }
        return condition;
    };

    if (!checkAndLog(model1.name === model2.name, `Model name mismatch: ${model1.name} vs ${model2.name}`)) {
        return false;
    }

    if (
        !checkAndLog(
            model1.parent?.name === model2.parent?.name,
            `Model parent name mismatch: ${model1.parent?.name} vs ${model2.parent?.name}`
        )
    ) {
        return false;
    }

    if (
        !checkAndLog(
            model1.definitions.length === model2.definitions.length,
            `Model definitions length mismatch: ${model1.definitions.length} vs ${model2.definitions.length}`
        )
    ) {
        return false;
    }

    return model1.definitions.every((def1, index) => {
        const def2 = model2.definitions[index];
        return (
            checkAndLog(
                def1.name === def2.name,
                `Definition name mismatch at index ${index}: ${def1.name} vs ${def2.name}`
            ) && checkAndLog(typesAreEqual(def1.type, def2.type, debug), `Definition type mismatch at index ${index}`)
        );
    });
}
