import {
    CountedType,
    EnumType,
    NamedType,
    NamedTypeReference,
    PrimitiveType,
    ProductType,
    ProductTypeField,
    SumType,
    Type
} from './model';

export function isNameAnonymous(name: string): boolean {
    return name.includes('?');
}

export function isNameLocal(name: string): boolean {
    return name.includes('.');
}

export function isNameContextual(name: string): boolean {
    return name.includes('/');
}

export function isNameGlobal(name: string): boolean {
    return (
        !isNameAnonymous(name) && !isNameLocal(name) && !isNameContextual(name)
    );
}

declare module './model' {
    interface Type {
        isWrapperProductType(): this is ProductType;
        isDiscriminated(): boolean;
    }
}

Type.prototype.isWrapperProductType = function (this: Type): boolean {
    return this instanceof ProductType && this.fields.length === 1;
} as Type['isWrapperProductType'];

function isDiscriminated(type: Type, seen: Set<string>): boolean {
    if (type instanceof ProductType) return true;
    if (type instanceof SumType)
        return !type.members.some((member) => !isDiscriminated(member, seen));

    if (type instanceof NamedTypeReference)
        return isDiscriminated(type.target, seen);
    if (type instanceof NamedType) {
        if (seen.has(type.name)) return false;
        seen.add(type.name);
        return isDiscriminated(type.type, seen);
    }
    return false;
}

Type.prototype.isDiscriminated = function (this: Type): boolean {
    return isDiscriminated(this, new Set());
};

export function findFieldName(field: ProductTypeField): string {
    if (isNameAnonymous(field.name)) {
        let target = field.type;
        while (target instanceof CountedType) {
            target = target.elementType;
        }
        if (target instanceof ProductType && target.fields.length === 1) {
            return target.fields[0].name;
        } else if (target instanceof NamedTypeReference) {
            return target.target.name;
        } else {
            return 'value';
        }
    } else {
        return field.name;
    }
}

export function typesAreEqual(t1: Type, t2: Type): boolean {
    // If they aren't the same class, they can't be equal
    if (t1.constructor !== t2.constructor) return false;

    if (t1 instanceof PrimitiveType) {
        return true;
    } else if (t1 instanceof EnumType && t2 instanceof EnumType) {
        // TODO: this should be independent of the order of the members
        if (t1.members.length !== t2.members.length) return false;
        for (let i = 0; i < t1.members.length; i++) {
            if (t1.members[i] !== t2.members[i]) return false;
        }
        return true;
    } else if (t1 instanceof CountedType && t2 instanceof CountedType) {
        return typesAreEqual(t1.elementType, t2.elementType);
    } else if (t1 instanceof SumType && t2 instanceof SumType) {
        // TODO: this should be independent of the order of the members
        if (t1.members.length !== t2.members.length) return false;
        for (let i = 0; i < t1.members.length; i++) {
            if (!typesAreEqual(t1.members[i], t2.members[i])) return false;
        }
        return true;
    } else if (t1 instanceof ProductType && t2 instanceof ProductType) {
        // TODO: this should be independent of the order of the members
        if (t1.fields.length !== t2.fields.length) return false;
        for (let i = 0; i < t1.fields.length; i++) {
            if (
                t1.fields[i].name !== t2.fields[i].name ||
                !typesAreEqual(t1.fields[i].type, t2.fields[i].type)
            )
                return false;
        }
        return true;
    } else if (t1 instanceof NamedType && t2 instanceof NamedType) {
        return t1.name === t2.name;
    } else if (
        t1 instanceof NamedTypeReference &&
        t2 instanceof NamedTypeReference
    ) {
        return t1.target.name === t2.target.name;
    }
    return false;
}
