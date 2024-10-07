import {
    Definition,
    Deletion,
    EnumType,
    MapType,
    MemberAddition,
    MemberDeletion,
    MemberModification,
    Model,
    NamedTypeReference,
    OptionType,
    ProductMember,
    ProductType,
    SequenceType,
    SetType,
    SumType,
    TupleType,
    Type,
    VoidType
} from './model';

export function findFieldName(field: ProductMember): string {
    if (field.name) {
        return field.name;
    }

    // Generate a name based on the field's type
    const typeName = getTypeName(field.type);
    return `${typeName.toLowerCase()}Field`;
}

function getTypeName(type: Type): string {
    if (typeof type === 'string') {
        return type;
    } else if ('constructor' in type) {
        return type.constructor.name;
    } else {
        return 'UnknownType';
    }
}

export function typesAreEqual(type1: Type, type2: Type): boolean {
    if (type1.constructor !== type2.constructor) {
        console.log(
            `Type mismatch: ${type1.constructor.name} vs ${type2.constructor.name}`
        );
        return false;
    }

    if (type1 instanceof VoidType && type2 instanceof VoidType) {
        return true;
    }

    if (typeof type1 === 'string' && typeof type2 === 'string') {
        if (type1 !== type2) {
            console.log(`Primitive type mismatch: ${type1} vs ${type2}`);
        }
        return type1 === type2;
    } else if (type1 instanceof EnumType && type2 instanceof EnumType) {
        const equal =
            JSON.stringify(type1.members) === JSON.stringify(type2.members);
        if (!equal) {
            console.log(
                `Enum members mismatch: ${JSON.stringify(type1.members)} vs ${JSON.stringify(type2.members)}`
            );
        }
        return equal;
    } else if (type1 instanceof SumType && type2 instanceof SumType) {
        return type1.members.every((m, i) => {
            const equal = typesAreEqual(m, type2.members[i]);
            if (!equal) {
                console.log(`Sum type member mismatch at index ${i}`);
            }
            return equal;
        });
    } else if (type1 instanceof ProductType && type2 instanceof ProductType) {
        return type1.members.every((m, i) => {
            const equal =
                m.name === type2.members[i].name &&
                typesAreEqual(m.type, type2.members[i].type);
            if (!equal) {
                console.log(
                    `Product type member mismatch at index ${i}: ${m.name} vs ${type2.members[i].name}`
                );
            }
            return equal;
        });
    } else if (type1 instanceof TupleType && type2 instanceof TupleType) {
        return type1.members.every((m, i) => {
            const equal = typesAreEqual(m, type2.members[i]);
            if (!equal) {
                console.log(`Tuple type member mismatch at index ${i}`);
            }
            return equal;
        });
    } else if (type1 instanceof MapType && type2 instanceof MapType) {
        const keyEqual = typesAreEqual(type1.keyType, type2.keyType);
        const valueEqual = typesAreEqual(type1.valueType, type2.valueType);
        if (!keyEqual) {
            console.log(`Map key type mismatch`);
        }
        if (!valueEqual) {
            console.log(`Map value type mismatch`);
        }
        return keyEqual && valueEqual;
    } else if (type1 instanceof SetType && type2 instanceof SetType) {
        const equal = typesAreEqual(type1.keyType, type2.keyType);
        if (!equal) {
            console.log(`Set key type mismatch`);
        }
        return equal;
    } else if (type1 instanceof SequenceType && type2 instanceof SequenceType) {
        const equal = typesAreEqual(type1.elementType, type2.elementType);
        if (!equal) {
            console.log(`Sequence element type mismatch`);
        }
        return equal;
    } else if (type1 instanceof OptionType && type2 instanceof OptionType) {
        const equal = typesAreEqual(type1.type, type2.type);
        if (!equal) {
            console.log(`Option type mismatch`);
        }
        return equal;
    } else if (
        type1 instanceof NamedTypeReference &&
        type2 instanceof NamedTypeReference
    ) {
        const equal =
            JSON.stringify(type1.names) === JSON.stringify(type2.names);
        if (!equal) {
            console.log(
                `Named type reference mismatch: ${JSON.stringify(type1.names)} vs ${JSON.stringify(type2.names)}`
            );
        }
        return equal;
    }

    console.log(
        `Unhandled type comparison: ${type1.constructor.name} vs ${type2.constructor.name}`
    );
    console.log(
        `${JSON.stringify(type1, null, 2)} vs ${JSON.stringify(type2, null, 2)}`
    );
    return false;
}

export function modelsAreEqual(model1: Model, model2: Model): boolean {
    let isEqual = true;

    if (model1.name !== model2.name) {
        console.log(`Model name mismatch: ${model1.name} vs ${model2.name}`);
        isEqual = false;
    }
    if (model1.parentName !== model2.parentName) {
        console.log(
            `Model parent name mismatch: ${model1.parentName} vs ${model2.parentName}`
        );
        isEqual = false;
    }
    if (model1.values.length !== model2.values.length) {
        console.log(
            `Model values length mismatch: ${model1.values.length} vs ${model2.values.length}`
        );
        isEqual = false;
    }

    model1.values.forEach((value, index) => {
        const value2 = model2.values[index];
        if (value.constructor !== value2.constructor) {
            console.log(
                `Value type mismatch at index ${index}: ${value.constructor.name} vs ${value2.constructor.name}`
            );
            isEqual = false;
        }

        if (value instanceof Definition && value2 instanceof Definition) {
            if (value.name !== value2.name) {
                console.log(
                    `Definition name mismatch at index ${index}: ${value.name} vs ${value2.name}`
                );
                isEqual = false;
            }
            if (!typesAreEqual(value.type, value2.type)) {
                console.log(`Definition type mismatch at index ${index}`);
                isEqual = false;
            }
        } else if (value instanceof Deletion && value2 instanceof Deletion) {
            if (value.name !== value2.name) {
                console.log(
                    `Deletion name mismatch at index ${index}: ${value.name} vs ${value2.name}`
                );
                isEqual = false;
            }
        } else if (
            value instanceof MemberModification &&
            value2 instanceof MemberModification
        ) {
            if (value.name !== value2.name) {
                console.log(
                    `MemberModification name mismatch at index ${index}: ${value.name} vs ${value2.name}`
                );
                isEqual = false;
            }
            if (value.values.length !== value2.values.length) {
                console.log(
                    `MemberModification values length mismatch at index ${index}: ${value.values.length} vs ${value2.values.length}`
                );
                isEqual = false;
            }
            value.values.forEach((v, i) => {
                const v2 = value2.values[i];
                if (v.constructor !== v2.constructor) {
                    console.log(
                        `MemberModification value type mismatch at index ${index}, subindex ${i}: ${v.constructor.name} vs ${v2.constructor.name}`
                    );
                    isEqual = false;
                }
                if (
                    v instanceof MemberAddition &&
                    v2 instanceof MemberAddition
                ) {
                    if (v.value.constructor !== v2.value.constructor) {
                        console.log(
                            `MemberAddition value type mismatch at index ${index}, subindex ${i}: ${v.value.constructor.name} vs ${v2.value.constructor.name}`
                        );
                        isEqual = false;
                    } else if (
                        v.value instanceof ProductMember &&
                        v2.value instanceof ProductMember
                    ) {
                        if (v.value.name !== v2.value.name) {
                            console.log(
                                `MemberAddition value name mismatch at index ${index}, subindex ${i}: ${v.value.name} vs ${v2.value.name}`
                            );
                            isEqual = false;
                        }
                        if (!typesAreEqual(v.value.type, v2.value.type)) {
                            console.log(
                                `MemberAddition value type mismatch at index ${index}, subindex ${i}: ${v.value.type.constructor.name} vs ${v2.value.type.constructor.name}`
                            );
                            isEqual = false;
                        }
                    } else {
                        if (!typesAreEqual(v.value, v2.value)) {
                            console.log(
                                `MemberAddition value mismatch at index ${index}, subindex ${i}`
                            );
                            isEqual = false;
                        }
                    }
                } else if (
                    v instanceof MemberDeletion &&
                    v2 instanceof MemberDeletion
                ) {
                    if (v.name !== v2.name) {
                        console.log(
                            `MemberDeletion name mismatch at index ${index}, subindex ${i}: ${v.name} vs ${v2.name}`
                        );
                        isEqual = false;
                    }
                }
            });
        }
    });

    return isEqual;
}
