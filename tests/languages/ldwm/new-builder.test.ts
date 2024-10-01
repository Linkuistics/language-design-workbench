import { NewLDWMBuilder } from '../../../src/languages/ldwm/new-builder';
import {
    Definition,
    EnumType,
    Model,
    ProductMember,
    ProductType,
    SequenceType,
    SumType
} from '../../../src/languages/ldwm/new-model';

let passedTests = 0;
let failedTests = 0;

function assertDeepEqual(actual: any, expected: any, message: string) {
    const actualStr = JSON.stringify(actual);
    const expectedStr = JSON.stringify(expected);
    if (actualStr !== expectedStr) {
        throw new Error(
            `${message}\nExpected: ${expectedStr}\nActual: ${actualStr}`
        );
    }
}

describe('NewLDWMBuilder', () => {
    test('creates a model with a primitive type definition', () => {
        const builder = new NewLDWMBuilder();
        builder.setModelName('TestModel');
        builder.startDefinition('TestString');
        builder.createPrimitiveType('string');
        builder.endDefinition();

        const model = builder.build();
        assertDeepEqual(
            model,
            new Model('TestModel', undefined, [
                new Definition('TestString', 'string')
            ]),
            'Model with primitive type mismatch'
        );
    });

    test('creates a model with an enum type', () => {
        const builder = new NewLDWMBuilder();
        builder.setModelName('TestModel');
        builder.startDefinition('TestEnum');
        builder.startEnumType();
        builder.addEnumMember('A');
        builder.addEnumMember('B');
        builder.addEnumMember('C');
        builder.endDefinition();

        const model = builder.build();
        assertDeepEqual(
            model,
            new Model('TestModel', undefined, [
                new Definition('TestEnum', new EnumType(['A', 'B', 'C']))
            ]),
            'Model with enum type mismatch'
        );
    });

    test('creates a model with a product type', () => {
        const builder = new NewLDWMBuilder();
        builder.setModelName('TestModel');
        builder.startDefinition('TestProduct');
        builder.startProductType();
        builder.createPrimitiveType('string');
        builder.addProductTypeMember('name');
        builder.createPrimitiveType('i32');
        builder.addProductTypeMember('age');
        builder.endProductType();
        builder.endDefinition();

        const model = builder.build();
        assertDeepEqual(
            model,
            new Model('TestModel', undefined, [
                new Definition(
                    'TestProduct',
                    new ProductType([
                        new ProductMember('name', 'string'),
                        new ProductMember('age', 'i32')
                    ])
                )
            ]),
            'Model with product type mismatch'
        );
    });

    test('creates a model with a sum type', () => {
        const builder = new NewLDWMBuilder();
        builder.setModelName('TestModel');
        builder.startDefinition('TestSum');
        builder.startSumType();
        builder.createPrimitiveType('string');
        builder.addSumTypeMember();
        builder.createPrimitiveType('i32');
        builder.addSumTypeMember();
        builder.endSumType();
        builder.endDefinition();

        const model = builder.build();
        assertDeepEqual(
            model,
            new Model('TestModel', undefined, [
                new Definition('TestSum', new SumType(['string', 'i32']))
            ]),
            'Model with sum type mismatch'
        );
    });

    test('creates a model with nested types', () => {
        const builder = new NewLDWMBuilder();
        builder.setModelName('TestModel');
        builder.startDefinition('TestNested');
        builder.startProductType();
        builder.createPrimitiveType('string');
        builder.addProductTypeMember('name');
        builder.createPrimitiveType('i32');
        builder.addProductTypeMember('age');
        builder.endProductType();
        builder.createSequenceType();
        builder.endDefinition();

        const model = builder.build();
        assertDeepEqual(
            model,
            new Model('TestModel', undefined, [
                new Definition(
                    'TestNested',
                    new SequenceType(
                        new ProductType([
                            new ProductMember('name', 'string'),
                            new ProductMember('age', 'i32')
                        ])
                    )
                )
            ]),
            'Model with nested types mismatch'
        );
    });
});

console.log(`\nTest Results: ${passedTests} passed, ${failedTests} failed`);
if (failedTests > 0) {
    process.exit(1);
}
