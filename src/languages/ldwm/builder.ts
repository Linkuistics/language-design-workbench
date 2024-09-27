import assert from 'assert';
import {
    ArrayType,
    BooleanType,
    EnumType,
    Model,
    NamedType,
    NamedTypeReference,
    OptionalType,
    ProductType,
    ProductTypeField,
    StringType,
    SumType,
    Type,
    VoidType
} from './model';

type Instruction = {
    type: string;
    params: any[];
};

type BuilderStateSnapshot = {
    instructionCount: number;
    currentNamedTypeName: string | null;
    typeReferenceFixupsCount: number;
    simulatedTypeStackLength: number;
};

enum SimulatedType {
    Void = 'Void',
    Boolean = 'Boolean',
    String = 'String',
    Enum = 'Enum',
    Product = 'Product',
    Sum = 'Sum',
    Array = 'Array',
    Optional = 'Optional',
    NamedReference = 'NamedReference'
}

export class LDWMBuilder {
    private instructions: Instruction[] = [];
    private simulatedTypeStack: SimulatedType[] = [];
    private currentNamedTypeName: string | null = null;
    private typeReferenceFixups: {
        typeReference: NamedTypeReference;
        name: string;
    }[] = [];

    constructor(public name: string) {}

    private addInstruction(type: string, ...params: any[]): void {
        this.instructions.push({ type, params });
    }

    get currentState(): SimulatedType | null {
        return this.simulatedTypeStack.length > 0
            ? this.simulatedTypeStack[this.simulatedTypeStack.length - 1]
            : null;
    }

    depth(): number {
        return this.simulatedTypeStack.length;
    }

    startNamedType(name: string): void {
        this.addInstruction('startNamedType', name);
        this.currentNamedTypeName = name;
    }

    endNamedType(): void {
        this.addInstruction('endNamedType');
        if (this.simulatedTypeStack.length !== 1) {
            console.log(this.simulatedTypeStack);
            console.log(this.instructions);
            throw new Error('endNamedType: expected exactly one type on stack');
        }
        this.simulatedTypeStack.pop();
        this.currentNamedTypeName = null;
    }

    createVoidType(): void {
        this.addInstruction('createVoidType');
        this.simulatedTypeStack.push(SimulatedType.Void);
    }

    createPrimitiveType(type: 'boolean' | 'string'): void {
        this.addInstruction('createPrimitiveType', type);
        this.simulatedTypeStack.push(
            type === 'boolean' ? SimulatedType.Boolean : SimulatedType.String
        );
    }

    startEnumType(): void {
        this.addInstruction('startEnumType');
        this.simulatedTypeStack.push(SimulatedType.Enum);
    }

    addEnumMember(member: string): void {
        this.addInstruction('addEnumMember', member);
        if (this.currentState !== SimulatedType.Enum) {
            console.log(this.simulatedTypeStack);
            console.log(this.instructions);
            throw new Error('addEnumMember: not in an enum type');
        }
    }

    startSumType(): void {
        this.addInstruction('startSumType');
        this.simulatedTypeStack.push(SimulatedType.Sum);
    }

    addSumTypeMember(): void {
        this.addInstruction('addSumTypeMember');
        this.simulatedTypeStack.pop();
        if (this.currentState !== SimulatedType.Sum) {
            console.log(this.simulatedTypeStack);
            console.log(this.instructions);
            throw new Error('addSumTypeMember: not in a sum type');
        }
    }

    startProductType(): void {
        this.addInstruction('startProductType');
        this.simulatedTypeStack.push(SimulatedType.Product);
    }

    addProductTypeField(name: string): void {
        this.addInstruction('addProductTypeField', name);
        this.simulatedTypeStack.pop();
        if (this.currentState !== SimulatedType.Product) {
            console.log(this.simulatedTypeStack);
            console.log(this.instructions);
            throw new Error('addProductTypeField: not in a product type');
        }
    }

    createArrayType(): void {
        this.addInstruction('createArrayType');
        if (this.simulatedTypeStack.length < 1) {
            console.log(this.instructions);
            throw new Error('createArrayType: not enough types on stack');
        }
        this.simulatedTypeStack.pop();
        this.simulatedTypeStack.push(SimulatedType.Array);
    }

    createOptionalType(): void {
        this.addInstruction('createOptionalType');
        if (this.simulatedTypeStack.length < 1) {
            console.log(this.instructions);
            throw new Error('createOptionType: not enough types on stack');
        }
        this.simulatedTypeStack.pop();
        this.simulatedTypeStack.push(SimulatedType.Optional);
    }

    createNamedTypeReference(name: string): void {
        this.addInstruction('createNamedTypeReference', name);
        this.simulatedTypeStack.push(SimulatedType.NamedReference);
    }

    getState(): BuilderStateSnapshot {
        return {
            instructionCount: this.instructions.length,
            currentNamedTypeName: this.currentNamedTypeName,
            typeReferenceFixupsCount: this.typeReferenceFixups.length,
            simulatedTypeStackLength: this.simulatedTypeStack.length
        };
    }

    restoreState(state: BuilderStateSnapshot): void {
        this.instructions = this.instructions.slice(0, state.instructionCount);
        this.currentNamedTypeName = state.currentNamedTypeName;
        this.typeReferenceFixups = this.typeReferenceFixups.slice(
            0,
            state.typeReferenceFixupsCount
        );
        this.simulatedTypeStack = this.simulatedTypeStack.slice(
            0,
            state.simulatedTypeStackLength
        );
    }

    build(): Model {
        const model = new Model(this.name);
        const typeStack: Type[] = [];
        let typeName = '';

        let ip = 0;
        try {
            while (ip < this.instructions.length) {
                const instruction = this.instructions[ip];
                switch (instruction.type) {
                    case 'startNamedType':
                        model.addNamedType(
                            instruction.params[0],
                            new VoidType()
                        ); // Placeholder
                        typeName = instruction.params[0];
                        break;
                    case 'endNamedType':
                        if (typeStack.length > 0) {
                            const namedType = model.namedTypes.get(typeName)!;
                            namedType.type = typeStack.pop()!;
                        }
                        break;
                    case 'createVoidType':
                        typeStack.push(new VoidType());
                        break;
                    case 'createPrimitiveType':
                        typeStack.push(
                            instruction.params[0] === 'boolean'
                                ? new BooleanType()
                                : new StringType()
                        );
                        break;
                    case 'startEnumType':
                        typeStack.push(new EnumType());
                        break;
                    case 'addEnumMember':
                        {
                            const tos = typeStack[typeStack.length - 1];
                            assert(tos instanceof EnumType);
                            tos.members.push(instruction.params[0]);
                        }
                        break;
                    case 'startSumType':
                        typeStack.push(new SumType());
                        break;
                    case 'addSumTypeMember':
                        {
                            const memberType = typeStack.pop()!;
                            const tos = typeStack[typeStack.length - 1];
                            assert(tos instanceof SumType);
                            tos.members.push(memberType);
                        }
                        break;
                    case 'startProductType':
                        typeStack.push(new ProductType());
                        break;
                    case 'addProductTypeField':
                        {
                            const fieldType = typeStack.pop()!;
                            const tos = typeStack[typeStack.length - 1];
                            assert(tos instanceof ProductType);
                            tos.fields.push(
                                new ProductTypeField(
                                    instruction.params[0],
                                    fieldType
                                )
                            );
                        }
                        break;
                    case 'createArrayType':
                        const elementType = typeStack.pop()!;
                        typeStack.push(new ArrayType(elementType));
                        break;
                    case 'createOptionalType':
                        const innerType = typeStack.pop()!;
                        typeStack.push(new OptionalType(innerType));
                        break;
                    case 'createNamedTypeReference':
                        const placeholder = new NamedType(
                            '**Invalid**',
                            new VoidType()
                        );
                        const namedTypeRef = new NamedTypeReference(
                            placeholder
                        );
                        this.typeReferenceFixups.push({
                            typeReference: namedTypeRef,
                            name: instruction.params[0]
                        });
                        typeStack.push(namedTypeRef);
                        break;
                }
                ip++;
            }
        } catch (error) {
            let indent = 0;
            for (let i = 0; i <= ip; i++) {
                const instruction = this.instructions[i];
                if (
                    instruction.type.startsWith('end') ||
                    instruction.type.startsWith('addSum') ||
                    instruction.type.startsWith('addProduct')
                ) {
                    indent--;
                }
                console.log(`${'  '.repeat(indent)}${instruction.type}`);
                if (
                    instruction.type.startsWith('start') ||
                    instruction.type.startsWith('create')
                ) {
                    indent++;
                }
            }

            throw error;
        }

        for (const { typeReference, name } of this.typeReferenceFixups) {
            const target = model.namedTypes.get(name);
            if (!target) {
                throw new Error(`Type reference target not found: ${name}`);
            }
            typeReference.target = target;
        }

        return model;
    }
}
