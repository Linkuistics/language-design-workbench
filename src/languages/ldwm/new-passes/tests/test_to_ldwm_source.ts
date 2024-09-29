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
} from '../../new-model';
import { ToLDWMSource } from '../to_ldwm-source';
import { FromLDWMSource } from '../from_ldwm-source';

function generateRandomString(length: number = 5): string {
    return Math.random()
        .toString(36)
        .substring(2, length + 2);
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
    if (type1.constructor !== type2.constructor) return false;

    if (type1 instanceof VoidType || typeof type1 === 'string') {
        return type1 === type2;
    } else if (type1 instanceof EnumType && type2 instanceof EnumType) {
        return JSON.stringify(type1.members) === JSON.stringify(type2.members);
    } else if (type1 instanceof SumType && type2 instanceof SumType) {
        return type1.members.every((m, i) =>
            areTypesEqual(m, type2.members[i])
        );
    } else if (type1 instanceof ProductType && type2 instanceof ProductType) {
        return type1.members.every(
            (m, i) =>
                m.name === type2.members[i].name &&
                areTypesEqual(m.type, type2.members[i].type)
        );
    } else if (type1 instanceof TupleType && type2 instanceof TupleType) {
        return type1.members.every((m, i) =>
            areTypesEqual(m, type2.members[i])
        );
    } else if (type1 instanceof MapType && type2 instanceof MapType) {
        return (
            areTypesEqual(type1.keyType, type2.keyType) &&
            areTypesEqual(type1.valueType, type2.valueType)
        );
    } else if (type1 instanceof SetType && type2 instanceof SetType) {
        return areTypesEqual(type1.keyType, type2.keyType);
    } else if (type1 instanceof SequenceType && type2 instanceof SequenceType) {
        return areTypesEqual(type1.elementType, type2.elementType);
    } else if (type1 instanceof OptionType && type2 instanceof OptionType) {
        return areTypesEqual(type1.type, type2.type);
    } else if (type1 instanceof ResultType && type2 instanceof ResultType) {
        return (
            areTypesEqual(type1.okType, type2.okType) &&
            areTypesEqual(type1.errType, type2.errType)
        );
    } else if (
        type1 instanceof NamedTypeReference &&
        type2 instanceof NamedTypeReference
    ) {
        return JSON.stringify(type1.names) === JSON.stringify(type2.names);
    }

    return false;
}

function areModelsEqual(model1: Model, model2: Model): boolean {
    if (model1.name !== model2.name || model1.parentName !== model2.parentName)
        return false;
    if (model1.values.length !== model2.values.length) return false;

    return model1.values.every((value, index) => {
        const value2 = model2.values[index];
        if (value.constructor !== value2.constructor) return false;

        if (value instanceof Definition && value2 instanceof Definition) {
            return (
                value.name === value2.name &&
                areTypesEqual(value.type, value2.type)
            );
        } else if (value instanceof Deletion && value2 instanceof Deletion) {
            return value.name === value2.name;
        } else if (
            value instanceof MemberModification &&
            value2 instanceof MemberModification
        ) {
            if (
                value.name !== value2.name ||
                value.values.length !== value2.values.length
            )
                return false;
            return value.values.every((v, i) => {
                const v2 = value2.values[i];
                if (v.constructor !== v2.constructor) return false;
                if (
                    v instanceof MemberAddition &&
                    v2 instanceof MemberAddition
                ) {
                    return areTypesEqual(v.value, v2.value);
                } else if (
                    v instanceof MemberDeletion &&
                    v2 instanceof MemberDeletion
                ) {
                    return v.name === v2.name;
                }
                return false;
            });
        }

        return false;
    });
}

function testToLDWMSource(iterations: number = 100): void {
    const toLDWMSource = new ToLDWMSource();
    const fromLDWMSource = new FromLDWMSource();

    for (let i = 0; i < iterations; i++) {
        const originalModel = generateRandomModel();
        const ldwmSource = toLDWMSource.transform(originalModel);

        try {
            const parsedModel = fromLDWMSource.transform(ldwmSource);

            if (!areModelsEqual(originalModel, parsedModel)) {
                console.error(`Test failed on iteration ${i + 1}`);
                console.error(
                    'Original model:',
                    JSON.stringify(originalModel, null, 2)
                );
                console.error('LDWM source:', ldwmSource);
                console.error(
                    'Parsed model:',
                    JSON.stringify(parsedModel, null, 2)
                );
                return;
            }
        } catch (error) {
            console.error(`Error parsing LDWM source on iteration ${i + 1}`);
            console.error(
                'Original model:',
                JSON.stringify(originalModel, null, 2)
            );
            console.error('LDWM source:', ldwmSource);
            console.error('Error:', error);
            return;
        }
    }

    console.log(`All ${iterations} tests passed successfully.`);
}

testToLDWMSource();
