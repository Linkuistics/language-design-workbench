import * as Model from './model';

export class Visitor {
    visitModel(node: Model.Model): void {
        node.values.forEach((x) => {
            if (x instanceof Model.Definition) {
                this.visitDefinition(x);
            } else if (x instanceof Model.Deletion) {
                this.visitDeletion(x);
            } else {
                this.visitMemberModification(x);
            }
        });
    }

    visitDefinition(node: Model.Definition): void {
        this.visitType(node.type);
    }

    visitDeletion(node: Model.Deletion): void {}

    visitMemberModification(node: Model.MemberModification): void {
        node.values.forEach((x) => {
            if (x instanceof Model.MemberDeletion) {
                this.visitMemberDeletion(x);
            } else {
                this.visitMemberAddition(x);
            }
        });
    }

    visitMemberDeletion(node: Model.MemberDeletion): void {}

    visitMemberAddition(node: Model.MemberAddition): void {
        if (node instanceof Model.ProductMember) {
            this.visitProductMember(node);
        } else {
            this.visitType(node);
        }
    }

    visitType(node: Model.Type): void {
        if (node instanceof Model.VoidType) {
            this.visitVoidType(node);
        } else if (typeof node === 'string') {
            this.visitPrimitiveType(node as Model.PrimitiveType);
        } else if (node instanceof Model.EnumType) {
            this.visitEnumType(node);
        } else if (node instanceof Model.NamedTypeReference) {
            this.visitNamedTypeReference(node);
        } else {
            this.visitTypeWithStructure(node);
        }
    }

    visitVoidType(node: Model.VoidType): void {}

    visitPrimitiveType(node: Model.PrimitiveType): void {}

    visitEnumType(node: Model.EnumType): void {}

    visitTypeWithStructure(node: Model.TypeWithStructure): void {
        if (node instanceof Model.SumType) {
            this.visitSumType(node);
        } else if (node instanceof Model.ProductType) {
            this.visitProductType(node);
        } else {
            this.visitGenericType(node);
        }
    }

    visitSumType(node: Model.SumType): void {
        node.members.forEach((x) => {
            this.visitType(x);
        });
    }

    visitProductType(node: Model.ProductType): void {
        node.members.forEach((x) => {
            this.visitProductMember(x);
        });
    }

    visitProductMember(node: Model.ProductMember): void {
        this.visitType(node.type);
    }

    visitGenericType(node: Model.GenericType): void {
        if (node instanceof Model.TupleType) {
            this.visitTupleType(node);
        } else if (node instanceof Model.MapType) {
            this.visitMapType(node);
        } else if (node instanceof Model.SetType) {
            this.visitSetType(node);
        } else if (node instanceof Model.SequenceType) {
            this.visitSequenceType(node);
        } else {
            this.visitOptionType(node);
        }
    }

    visitTupleType(node: Model.TupleType): void {
        node.members.forEach((x) => {
            this.visitType(x);
        });
    }

    visitMapType(node: Model.MapType): void {
        this.visitType(node.keyType);
        this.visitType(node.valueType);
    }

    visitSetType(node: Model.SetType): void {
        this.visitType(node.keyType);
    }

    visitSequenceType(node: Model.SequenceType): void {
        this.visitType(node.elementType);
    }

    visitOptionType(node: Model.OptionType): void {
        this.visitType(node.type);
    }

    visitNamedTypeReference(node: Model.NamedTypeReference): void {}
}
