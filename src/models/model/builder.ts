import {
    Model,
    Definition,
    Deletion,
    MemberModification,
    MemberDeletion,
    MemberAddition,
    Type,
    VoidType,
    PrimitiveType,
    EnumType,
    SumType,
    ProductType,
    ProductMember,
    TupleType,
    MapType,
    SetType,
    SequenceType,
    OptionType,
    ResultType,
    NamedTypeReference,
    Id
} from './model';
import assert from 'assert';

type Instruction = {
    type: string;
    params: any[];
};

type BuilderStateSnapshot = {
    instructionCount: number;
    simulatedTypeStackLength: number;
};

enum SimulatedType {
    Void = 'Void',
    Primitive = 'Primitive',
    Enum = 'Enum',
    Sum = 'Sum',
    Product = 'Product',
    Tuple = 'Tuple',
    Map = 'Map',
    Set = 'Set',
    Sequence = 'Sequence',
    Option = 'Option',
    Result = 'Result',
    NamedReference = 'NamedReference'
}

export class ModelBuilder {
    private instructions: Instruction[] = [];
    private simulatedTypeStack: SimulatedType[] = [];

    constructor() {}

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

    startModel(name: Id): void {
        this.addInstruction('startModel', name);
    }

    setModelParentName(parentName: Id): void {
        this.addInstruction('setModelParentName', parentName);
    }

    endModel(): void {}

    startDefinition(name: Id): void {
        this.addInstruction('startDefinition', name);
    }

    endDefinition(): void {
        this.addInstruction('endDefinition');
        assert(
            this.simulatedTypeStack.length === 1,
            'endDefinition: expected exactly one type on stack'
        );
        this.simulatedTypeStack.pop();
    }

    addDeletion(name: Id): void {
        this.addInstruction('addDeletion', name);
    }

    startMemberModification(name: Id): void {
        this.addInstruction('startMemberModification', name);
    }

    endMemberModification(): void {
        this.addInstruction('endMemberModification');
    }

    addMemberDeletion(name: Id): void {
        this.addInstruction('addMemberDeletion', name);
    }

    addMemberAddition(): void {
        this.addInstruction('addMemberAddition');
        this.simulatedTypeStack.pop();
    }

    createVoidType(): void {
        this.addInstruction('createVoidType');
        this.simulatedTypeStack.push(SimulatedType.Void);
    }

    createPrimitiveType(type: PrimitiveType): void {
        this.addInstruction('createPrimitiveType', type);
        this.simulatedTypeStack.push(SimulatedType.Primitive);
    }

    startEnumType(): void {
        this.addInstruction('startEnumType');
        this.simulatedTypeStack.push(SimulatedType.Enum);
    }

    addEnumMember(member: Id): void {
        this.addInstruction('addEnumMember', member);
        assert(this.currentState === SimulatedType.Enum);
    }

    startSumType(): void {
        this.addInstruction('startSumType');
        this.simulatedTypeStack.push(SimulatedType.Sum);
    }

    addSumTypeMember(): void {
        this.addInstruction('addSumTypeMember');
        this.simulatedTypeStack.pop();
        assert(this.currentState === SimulatedType.Sum);
    }

    endSumType(): void {
        assert(this.currentState === SimulatedType.Sum);
    }

    startProductType(): void {
        this.addInstruction('startProductType');
        this.simulatedTypeStack.push(SimulatedType.Product);
    }

    addProductTypeMember(name: Id): void {
        this.addInstruction('addProductTypeMember', name);
        this.simulatedTypeStack.pop();
        assert(this.currentState === SimulatedType.Product);
    }

    endProductType(): void {
        assert(this.currentState === SimulatedType.Product);
    }

    startTupleType(): void {
        this.addInstruction('startTupleType');
        this.simulatedTypeStack.push(SimulatedType.Tuple);
    }

    addTupleTypeMember(): void {
        this.addInstruction('addTupleTypeMember');
        assert(this.currentState === SimulatedType.Tuple);
    }

    endTupleType(): void {
        assert(this.currentState === SimulatedType.Tuple);
    }

    createMapType(): void {
        this.addInstruction('createMapType');
        if (this.simulatedTypeStack.length < 2) {
            throw new Error('createMapType: not enough types on stack');
        }
        this.simulatedTypeStack.pop();
        this.simulatedTypeStack.pop();
        this.simulatedTypeStack.push(SimulatedType.Map);
    }

    createSetType(): void {
        this.addInstruction('createSetType');
        if (this.simulatedTypeStack.length < 1) {
            throw new Error('createSetType: not enough types on stack');
        }
        this.simulatedTypeStack.pop();
        this.simulatedTypeStack.push(SimulatedType.Set);
    }

    createSequenceType(): void {
        this.addInstruction('createSequenceType');
        if (this.simulatedTypeStack.length < 1) {
            throw new Error('createSequenceType: not enough types on stack');
        }
        this.simulatedTypeStack.pop();
        this.simulatedTypeStack.push(SimulatedType.Sequence);
    }

    createOptionType(): void {
        this.addInstruction('createOptionType');
        if (this.simulatedTypeStack.length < 1) {
            throw new Error('createOptionType: not enough types on stack');
        }
        this.simulatedTypeStack.pop();
        this.simulatedTypeStack.push(SimulatedType.Option);
    }

    createResultType(): void {
        this.addInstruction('createResultType');
        if (this.simulatedTypeStack.length < 2) {
            throw new Error('createResultType: not enough types on stack');
        }
        this.simulatedTypeStack.pop();
        this.simulatedTypeStack.pop();
        this.simulatedTypeStack.push(SimulatedType.Result);
    }

    createNamedTypeReference(names: Id[]): void {
        this.addInstruction('createNamedTypeReference', names);
        this.simulatedTypeStack.push(SimulatedType.NamedReference);
    }

    getState(): BuilderStateSnapshot {
        return {
            instructionCount: this.instructions.length,
            simulatedTypeStackLength: this.simulatedTypeStack.length
        };
    }

    restoreState(state: BuilderStateSnapshot): void {
        this.instructions = this.instructions.slice(0, state.instructionCount);
        this.simulatedTypeStack = this.simulatedTypeStack.slice(
            0,
            state.simulatedTypeStackLength
        );
    }

    build(): Model {
        const typeStack: Type[] = [];
        let currentDefinitionName: Id | null = null;
        let model = new Model('', undefined, []);

        let ip = 0;
        while (ip < this.instructions.length) {
            const instruction = this.instructions[ip];
            switch (instruction.type) {
                case 'startModel':
                    model.name = instruction.params[0];
                    break;
                case 'setModelParentName':
                    model.parentName = instruction.params[0];
                    break;
                case 'endModel':
                    break;
                case 'startDefinition':
                    currentDefinitionName = instruction.params[0];
                    break;
                case 'endDefinition':
                    const type = typeStack.pop()!;
                    model.values.push(
                        new Definition(currentDefinitionName!, type)
                    );
                    currentDefinitionName = null;
                    break;
                case 'addDeletion':
                    model.values.push(new Deletion(instruction.params[0]));
                    break;
                case 'startMemberModification':
                    model.values.push(
                        new MemberModification(instruction.params[0], [])
                    );
                    break;
                case 'addMemberDeletion':
                    {
                        const memberModification =
                            model.values[model.values.length - 1];
                        assert(
                            memberModification instanceof MemberModification
                        );
                        memberModification.values.push(
                            new MemberDeletion(instruction.params[0])
                        );
                    }
                    break;
                case 'addMemberAddition':
                    {
                        const type = typeStack.pop()!;
                        const memberModification =
                            model.values[model.values.length - 1];
                        assert(
                            memberModification instanceof MemberModification
                        );
                        memberModification.values.push(
                            new MemberAddition(type)
                        );
                    }
                    break;
                case 'createVoidType':
                    typeStack.push(new VoidType());
                    break;
                case 'createPrimitiveType':
                    typeStack.push(instruction.params[0]);
                    break;
                case 'startEnumType':
                    typeStack.push(new EnumType([]));
                    break;
                case 'addEnumMember':
                    {
                        const enumType = typeStack[typeStack.length - 1];
                        assert(enumType instanceof EnumType);
                        enumType.members.push(instruction.params[0]);
                    }
                    break;
                case 'startSumType':
                    typeStack.push(new SumType([]));
                    break;
                case 'addSumTypeMember':
                    {
                        const type = typeStack.pop()!;
                        const sumType = typeStack[typeStack.length - 1];
                        assert(sumType instanceof SumType);
                        sumType.members.push(type);
                    }
                    break;
                case 'startProductType':
                    typeStack.push(new ProductType([]));
                    break;
                case 'addProductTypeMember':
                    {
                        const type = typeStack.pop()!;
                        const productType = typeStack[typeStack.length - 1];
                        assert(productType instanceof ProductType);
                        productType.members.push(
                            new ProductMember(instruction.params[0], type)
                        );
                    }
                    break;
                case 'startTupleType':
                    typeStack.push(new TupleType([]));
                    break;
                case 'addTupleTypeMember':
                    {
                        const type = typeStack.pop()!;
                        const tupleType = typeStack[typeStack.length - 1];
                        assert(tupleType instanceof TupleType);
                        tupleType.members.push(type);
                    }
                    break;
                case 'createMapType':
                    {
                        const valueType = typeStack.pop()!;
                        const keyType = typeStack.pop()!;
                        typeStack.push(new MapType(keyType, valueType));
                    }
                    break;
                case 'createSetType':
                    {
                        const type = typeStack.pop()!;
                        typeStack.push(new SetType(type));
                    }
                    break;
                case 'createSequenceType':
                    {
                        const type = typeStack.pop()!;
                        typeStack.push(new SequenceType(type));
                    }
                    break;
                case 'createOptionType':
                    {
                        const type = typeStack.pop()!;
                        typeStack.push(new OptionType(type));
                    }
                    break;
                case 'createResultType':
                    {
                        const errType = typeStack.pop()!;
                        const okType = typeStack.pop()!;
                        typeStack.push(new ResultType(okType, errType));
                    }
                    break;
                case 'createNamedTypeReference':
                    typeStack.push(
                        new NamedTypeReference(instruction.params[0])
                    );
                    break;
            }
            ip++;
        }

        return model;
    }
}
