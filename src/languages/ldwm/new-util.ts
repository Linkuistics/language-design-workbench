import { ProductMember, Type } from './new-model';

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
