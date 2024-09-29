import {
    Model,
    Definition,
    Deletion,
    MemberModification,
    Type,
    VoidType,
    PrimitiveType,
    EnumType,
    SumType,
    ProductType,
    TupleType,
    MapType,
    SetType,
    SequenceType,
    OptionType,
    ResultType,
    NamedTypeReference,
    ProductMember,
    MemberAddition,
    MemberDeletion
} from '../../../../src/languages/ldwm/new-model';
import { ToLDWMSource } from '../../../../src/languages/ldwm/new-passes/to_ldwm-source';
import { FromLDWMSource } from '../../../../src/languages/ldwm/new-passes/from_ldwm-source';

function generateRandomString(length: number = 5): string {
    const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const validChars = alphabet + '0123456789_';
    let result = alphabet[Math.floor(Math.random() * alphabet.length)];
    for (let i = 1; i < length; i++) {
        result += validChars[Math.floor(Math.random() * validChars.length)];
    }
    return result;
}

function generateRandomType(depth: number = 0): Type {
    const maxDepth = 3;
    if (depth >= maxDepth) {
        const primitives: PrimitiveType[] = [
            'boolean',
            'string',
            'i32',
            'i64',
            'f32',
            'f64'
        ];
        return primitives[Math.floor(Math.random() * primitives.length)];
    }

    const types: (() => Type)[] = [
        () => new VoidType(),
        () => 'boolean' as PrimitiveType,
        () => 'string' as PrimitiveType,
        () => 'i32' as PrimitiveType,
        () => new EnumType([generateRandomString(), generateRandomString()]),
        () =>
            new SumType([
                generateRandomType(depth + 1),
                generateRandomType(depth + 1)
            ]),
        () =>
            new ProductType([
                {
                    name: generateRandomString(),
                    type: generateRandomType(depth + 1)
                },
                {
                    name: generateRandomString(),
                    type: generateRandomType(depth + 1)
                }
            ]),
        () =>
            new TupleType([
                generateRandomType(depth + 1),
                generateRandomType(depth + 1)
            ]),
        () =>
            new MapType(
                generateRandomType(depth + 1),
                generateRandomType(depth + 1)
            ),
        () => new SetType(generateRandomType(depth + 1)),
        () => new SequenceType(generateRandomType(depth + 1)),
        () => new OptionType(generateRandomType(depth + 1)),
        () =>
            new ResultType(
                generateRandomType(depth + 1),
                generateRandomType(depth + 1)
            ),
        () => new NamedTypeReference([generateRandomString()])
    ];
    return types[Math.floor(Math.random() * types.length)]();
}

function generateRandomModel(): Model {
    const name = generateRandomString();
    const parentName = Math.random() > 0.5 ? generateRandomString() : undefined;
    const values: (Definition | Deletion | MemberModification)[] = [];

    for (let i = 0; i < Math.floor(Math.random() * 5) + 1; i++) {
        const rand = Math.random();
        if (rand < 0.6) {
            values.push(
                new Definition(generateRandomString(), generateRandomType())
            );
        } else if (rand < 0.8) {
            values.push(new Deletion(generateRandomString()));
        } else {
            const memberModification = new MemberModification(
                generateRandomString(),
                []
            );
            for (let j = 0; j < Math.floor(Math.random() * 3) + 1; j++) {
                if (Math.random() > 0.5) {
                    memberModification.values.push(
                        new MemberAddition(generateRandomType())
                    );
                } else {
                    memberModification.values.push(
                        new MemberDeletion(generateRandomString())
                    );
                }
            }
            values.push(memberModification);
        }
    }

    return new Model(name, parentName, values);
}

function areTypesEqual(type1: Type, type2: Type): boolean {
    if (type1.constructor !== type2.constructor) {
        console.log(
            `Type mismatch: ${type1.constructor.name} vs ${type2.constructor.name}`
        );
        return false;
    }

    if (type1 instanceof VoidType && type2 instanceof VoidType) {
        console.log('Both types are VoidType, they are equal');
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
            const equal = areTypesEqual(m, type2.members[i]);
            if (!equal) {
                console.log(`Sum type member mismatch at index ${i}`);
            }
            return equal;
        });
    } else if (type1 instanceof ProductType && type2 instanceof ProductType) {
        return type1.members.every((m, i) => {
            const equal =
                m.name === type2.members[i].name &&
                areTypesEqual(m.type, type2.members[i].type);
            if (!equal) {
                console.log(
                    `Product type member mismatch at index ${i}: ${m.name} vs ${type2.members[i].name}`
                );
            }
            return equal;
        });
    } else if (type1 instanceof TupleType && type2 instanceof TupleType) {
        return type1.members.every((m, i) => {
            const equal = areTypesEqual(m, type2.members[i]);
            if (!equal) {
                console.log(`Tuple type member mismatch at index ${i}`);
            }
            return equal;
        });
    } else if (type1 instanceof MapType && type2 instanceof MapType) {
        const keyEqual = areTypesEqual(type1.keyType, type2.keyType);
        const valueEqual = areTypesEqual(type1.valueType, type2.valueType);
        if (!keyEqual) {
            console.log(`Map key type mismatch`);
        }
        if (!valueEqual) {
            console.log(`Map value type mismatch`);
        }
        return keyEqual && valueEqual;
    } else if (type1 instanceof SetType && type2 instanceof SetType) {
        const equal = areTypesEqual(type1.keyType, type2.keyType);
        if (!equal) {
            console.log(`Set key type mismatch`);
        }
        return equal;
    } else if (type1 instanceof SequenceType && type2 instanceof SequenceType) {
        const equal = areTypesEqual(type1.elementType, type2.elementType);
        if (!equal) {
            console.log(`Sequence element type mismatch`);
        }
        return equal;
    } else if (type1 instanceof OptionType && type2 instanceof OptionType) {
        const equal = areTypesEqual(type1.type, type2.type);
        if (!equal) {
            console.log(`Option type mismatch`);
        }
        return equal;
    } else if (type1 instanceof ResultType && type2 instanceof ResultType) {
        const okEqual = areTypesEqual(type1.okType, type2.okType);
        const errEqual = areTypesEqual(type1.errType, type2.errType);
        if (!okEqual) {
            console.log(`Result ok type mismatch`);
        }
        if (!errEqual) {
            console.log(`Result err type mismatch`);
        }
        return okEqual && errEqual;
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
    return false;
}

function areModelsEqual(model1: Model, model2: Model): boolean {
    if (model1.name !== model2.name) {
        console.log(`Model name mismatch: ${model1.name} vs ${model2.name}`);
        return false;
    }
    if (model1.parentName !== model2.parentName) {
        console.log(
            `Model parent name mismatch: ${model1.parentName} vs ${model2.parentName}`
        );
        return false;
    }
    if (model1.values.length !== model2.values.length) {
        console.log(
            `Model values length mismatch: ${model1.values.length} vs ${model2.values.length}`
        );
        return false;
    }

    return model1.values.every((value, index) => {
        const value2 = model2.values[index];
        if (value.constructor !== value2.constructor) {
            console.log(
                `Value type mismatch at index ${index}: ${value.constructor.name} vs ${value2.constructor.name}`
            );
            return false;
        }

        if (value instanceof Definition && value2 instanceof Definition) {
            const nameEqual = value.name === value2.name;
            const typeEqual = areTypesEqual(value.type, value2.type);
            if (!nameEqual) {
                console.log(
                    `Definition name mismatch at index ${index}: ${value.name} vs ${value2.name}`
                );
            }
            if (!typeEqual) {
                console.log(`Definition type mismatch at index ${index}`);
            }
            return nameEqual && typeEqual;
        } else if (value instanceof Deletion && value2 instanceof Deletion) {
            const equal = value.name === value2.name;
            if (!equal) {
                console.log(
                    `Deletion name mismatch at index ${index}: ${value.name} vs ${value2.name}`
                );
            }
            return equal;
        } else if (
            value instanceof MemberModification &&
            value2 instanceof MemberModification
        ) {
            if (value.name !== value2.name) {
                console.log(
                    `MemberModification name mismatch at index ${index}: ${value.name} vs ${value2.name}`
                );
                return false;
            }
            if (value.values.length !== value2.values.length) {
                console.log(
                    `MemberModification values length mismatch at index ${index}: ${value.values.length} vs ${value2.values.length}`
                );
                return false;
            }
            return value.values.every((v, i) => {
                const v2 = value2.values[i];
                if (v.constructor !== v2.constructor) {
                    console.log(
                        `MemberModification value type mismatch at index ${index}, subindex ${i}: ${v.constructor.name} vs ${v2.constructor.name}`
                    );
                    return false;
                }
                if (
                    v instanceof MemberAddition &&
                    v2 instanceof MemberAddition
                ) {
                    const equal = areTypesEqual(v.value, v2.value);
                    if (!equal) {
                        console.log(
                            `MemberAddition value mismatch at index ${index}, subindex ${i}`
                        );
                    }
                    return equal;
                } else if (
                    v instanceof MemberDeletion &&
                    v2 instanceof MemberDeletion
                ) {
                    const equal = v.name === v2.name;
                    if (!equal) {
                        console.log(
                            `MemberDeletion name mismatch at index ${index}, subindex ${i}: ${v.name} vs ${v2.name}`
                        );
                    }
                    return equal;
                }
                return false;
            });
        }

        return false;
    });
}

describe('ToLDWMSource', () => {
    const toLDWMSource = new ToLDWMSource();
    const fromLDWMSource = new FromLDWMSource();

    it('should correctly transform and parse back random models', () => {
        const iterations = 100;

        for (let i = 0; i < iterations; i++) {
            const originalModel = generateRandomModel();
            let ldwmSource: string;
            let parsedModel: Model;

            try {
                ldwmSource = toLDWMSource.transform(originalModel);
            } catch (error) {
                console.error(
                    `Error transforming model to LDWM source on iteration ${i + 1}:`
                );
                console.error(
                    'Original Model:',
                    JSON.stringify(originalModel, null, 2)
                );
                throw new Error(
                    `Error transforming model to LDWM source on iteration ${i + 1}: ${error}`
                );
            }

            try {
                parsedModel = fromLDWMSource.transform(ldwmSource);
            } catch (error) {
                console.error(`Parsing error on iteration ${i + 1}:`);
                console.error(
                    'Original Model:',
                    JSON.stringify(originalModel, null, 2)
                );
                console.error('Generated LDWM Source:', ldwmSource);
                console.error(error);
                throw new Error(
                    `Error parsing LDWM source on iteration ${i + 1}: ${error}`
                );
            }

            const modelsEqual = areModelsEqual(originalModel, parsedModel);

            if (!modelsEqual) {
                console.error(`Models not equal on iteration ${i + 1}`);
                console.error(
                    'Original Model:',
                    JSON.stringify(originalModel, null, 2)
                );
                console.error('Generated LDWM Source:', ldwmSource);
                console.error(
                    'Parsed Model:',
                    JSON.stringify(parsedModel, null, 2)
                );
            }

            expect(modelsEqual).toBe(true);
        }
    });
});
