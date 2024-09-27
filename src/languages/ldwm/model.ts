import { Language } from '../language';

export class Model {
    constructor(public name: string) {}

    public namedTypes: Map<string, NamedType> = new Map();

    addNamedType(name: string, type: Type): NamedTypeReference {
        const namedType = new NamedType(name, type);
        this.namedTypes.set(name, namedType);
        return new NamedTypeReference(namedType);
    }
}

export abstract class Type {
    abstract visit(visitor: Visitor): VisitResult;
    subVisit(visitor: Visitor): void {}
}

export abstract class PrimitiveType extends Type {
    visit(visitor: Visitor): VisitResult {
        return visitor.visitPrimitiveType(this);
    }
}

export class VoidType extends PrimitiveType {}
export class BooleanType extends PrimitiveType {}
export class StringType extends PrimitiveType {}

export class EnumType extends Type {
    public members: string[] = [];

    visit(visitor: Visitor): VisitResult {
        return visitor.visitEnumType(this);
    }
}

export class NamedTypeReference extends Type {
    constructor(public target: NamedType) {
        super();
    }

    visit(visitor: Visitor): VisitResult {
        // we don't visit the target because this is the class that breaks
        // cyclic references, which is also why it is not a TypeWithStructure
        return visitor.visitNamedTypeReference(this);
    }
}

export abstract class TypeWithStructure extends Type {
    abstract visit(visitor: Visitor): VisitResult;
    subVisit(visitor: Visitor): void {}
}

export abstract class CountedType extends TypeWithStructure {
    constructor(public elementType: Type) {
        super();
    }

    subVisit(visitor: Visitor): void {
        let result = this.elementType.visit(visitor);
        if (result) this.elementType = result;
    }
}

export class ArrayType extends CountedType {
    constructor(public elementType: Type) {
        super(elementType);
    }

    visit(visitor: Visitor): VisitResult {
        const result = visitor.preVisitArrayType(this);
        if (result instanceof Type) return result;
        if (result == false) return;
        this.subVisit(visitor);
        return visitor.postVisitArrayType(this);
    }
}

export class OptionalType extends CountedType {
    constructor(public elementType: Type) {
        super(elementType);
    }

    visit(visitor: Visitor): VisitResult {
        const result = visitor.preVisitOptionalType(this);
        if (result instanceof Type) return result;
        if (result == false) return;
        this.subVisit(visitor);
        return visitor.postVisitOptionalType(this);
    }
}

export class SumType extends TypeWithStructure {
    public members: Type[] = [];

    visit(visitor: Visitor): VisitResult {
        const result = visitor.preVisitSumType(this);
        if (result instanceof Type) return result;
        if (result == false) return;
        this.subVisit(visitor);
        return visitor.postVisitSumType(this);
    }

    subVisit(visitor: Visitor): void {
        for (let i = 0; i < this.members.length; i++) {
            let result = this.members[i].visit(visitor);
            if (result) this.members[i] = result;
        }
    }
}

export class ProductTypeField {
    constructor(
        public name: string,
        public type: Type
    ) {}
}

export class ProductType extends TypeWithStructure {
    public fields: ProductTypeField[] = [];

    visit(visitor: Visitor): VisitResult {
        const result = visitor.preVisitProductType(this);
        if (result instanceof Type) return result;
        if (result == false) return;
        this.subVisit(visitor);
        return visitor.postVisitProductType(this);
    }

    subVisit(visitor: Visitor): void {
        this.fields.forEach((field) => {
            let result = field.type.visit(visitor);
            if (result) field.type = result;
        });
    }
}

export class NamedType extends TypeWithStructure {
    constructor(
        public name: string,
        public type: Type
    ) {
        super();
    }

    visit(visitor: Visitor): VisitResult {
        const result = visitor.preVisitNamedType(this);
        if (result instanceof Type) return result;
        if (result == false) return;
        this.subVisit(visitor);
        return visitor.postVisitNamedType(this);
    }

    subVisit(visitor: Visitor): void {
        let result = this.type.visit(visitor);
        if (result) this.type = result;
    }
}

export type VisitResult = Type | void;
export type StructurePreVisitResult = boolean | VisitResult;

export class Visitor {
    visitType(type: Type): VisitResult {}

    visitEnumType(type: EnumType): VisitResult {
        return this.visitType(type);
    }
    visitPrimitiveType(type: PrimitiveType): VisitResult {
        return this.visitType(type);
    }
    visitNamedTypeReference(type: NamedTypeReference): VisitResult {
        return this.visitType(type);
    }

    // These are called before the substructure is visited.

    preVisitTypeWithStructure(
        type: TypeWithStructure
    ): StructurePreVisitResult {
        return this.visitType(type);
    }
    preVisitCountedType(type: CountedType): StructurePreVisitResult {
        return this.preVisitTypeWithStructure(type);
    }
    preVisitArrayType(type: ArrayType): StructurePreVisitResult {
        return this.preVisitCountedType(type);
    }
    preVisitOptionalType(type: OptionalType): StructurePreVisitResult {
        return this.preVisitCountedType(type);
    }
    preVisitSumType(type: SumType): StructurePreVisitResult {
        return this.preVisitTypeWithStructure(type);
    }
    preVisitProductType(type: ProductType): StructurePreVisitResult {
        return this.preVisitTypeWithStructure(type);
    }
    preVisitNamedType(type: NamedType): StructurePreVisitResult {
        this.preVisitTypeWithStructure(type);
    }

    // These are called after the substructure is visited.

    postVisitTypeWithStructure(type: TypeWithStructure): VisitResult {}

    postVisitCountedType(type: CountedType): VisitResult {
        return this.postVisitTypeWithStructure(type);
    }
    postVisitArrayType(type: ArrayType): VisitResult {
        this.postVisitCountedType(type);
    }
    postVisitOptionalType(type: OptionalType): VisitResult {
        this.postVisitCountedType(type);
    }
    postVisitSumType(type: SumType): VisitResult {
        return this.postVisitTypeWithStructure(type);
    }
    postVisitNamedType(type: NamedType): VisitResult {
        return this.postVisitTypeWithStructure(type);
    }
    postVisitProductType(type: ProductType): VisitResult {
        return this.postVisitTypeWithStructure(type);
    }
}

declare module './model' {
    interface Type {
        asString(): string;
    }
}

StringType.prototype.asString = function (this: StringType): string {
    return 'string';
};

BooleanType.prototype.asString = function (this: BooleanType): string {
    return 'boolean';
};

EnumType.prototype.asString = function (this: EnumType): string {
    return 'enum';
};

ProductType.prototype.asString = function (this: ProductType): string {
    return '{ }';
};

SumType.prototype.asString = function (this: SumType): string {
    return 'A | B';
};

ArrayType.prototype.asString = function (this: ArrayType): string {
    return 'seq<...>';
};

OptionalType.prototype.asString = function (this: OptionalType): string {
    return 'option<...>';
};

NamedTypeReference.prototype.asString = function (
    this: NamedTypeReference
): string {
    return this.target.name;
};
