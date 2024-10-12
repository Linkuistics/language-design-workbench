import * as Model from './model';

export class Visitor {
    visitModel(node: Model.Model): void {
        node.values.forEach((x) => {
            switch (x.modelType) {
                case Model.ModelTypeId.Definition:
                    this.visitDefinition(x);
                    break;
                case Model.ModelTypeId.Deletion:
                    this.visitDeletion(x);
                    break;
                default:
                    this.visitMemberModification(x);
                    break;
            }
        });
    }

    visitDefinition(node: Model.Definition): void {
        this.visitType(node.type);
    }

    visitDeletion(node: Model.Deletion): void {}

    visitMemberModification(node: Model.MemberModification): void {
        node.values.forEach((x) => {
            switch (x.modelType) {
                case Model.ModelTypeId.MemberDeletion:
                    this.visitMemberDeletion(x);
                    break;
                default:
                    this.visitMemberAddition(x);
                    break;
            }
        });
    }

    visitMemberDeletion(node: Model.MemberDeletion): void {}

    visitMemberAddition(node: Model.MemberAddition): void {
        switch (node.value.modelType) {
            case Model.ModelTypeId.ProductMember:
                this.visitProductMember(node.value);
                break;
            default:
                this.visitType(node.value);
                break;
        }
    }

    visitType(node: Model.Type): void {
        switch (node.modelType) {
            case Model.ModelTypeId.VoidType:
                this.visitVoidType(node);
                break;
            case Model.ModelTypeId.PrimitiveType:
                this.visitPrimitiveType(node);
                break;
            case Model.ModelTypeId.EnumType:
                this.visitEnumType(node);
                break;
            case Model.ModelTypeId.NamedTypeReference:
                this.visitNamedTypeReference(node);
                break;
            case Model.ModelTypeId.SumType:
            case Model.ModelTypeId.ProductType:
            case Model.ModelTypeId.TupleType:
            case Model.ModelTypeId.MapType:
            case Model.ModelTypeId.SetType:
            case Model.ModelTypeId.SequenceType:
            case Model.ModelTypeId.OptionType:
                this.visitTypeWithStructure(node);
                break;
        }
    }

    visitVoidType(node: Model.VoidType): void {}

    visitPrimitiveType(node: Model.PrimitiveType): void {}

    visitEnumType(node: Model.EnumType): void {}

    visitTypeWithStructure(node: Model.TypeWithStructure): void {
        switch (node.modelType) {
            case Model.ModelTypeId.SumType:
                this.visitSumType(node);
                break;
            case Model.ModelTypeId.ProductType:
                this.visitProductType(node);
                break;
            case Model.ModelTypeId.TupleType:
            case Model.ModelTypeId.MapType:
            case Model.ModelTypeId.SetType:
            case Model.ModelTypeId.SequenceType:
            case Model.ModelTypeId.OptionType:
                this.visitGenericType(node);
                break;
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
        switch (node.modelType) {
            case Model.ModelTypeId.TupleType:
                this.visitTupleType(node);
                break;
            case Model.ModelTypeId.MapType:
                this.visitMapType(node);
                break;
            case Model.ModelTypeId.SetType:
                this.visitSetType(node);
                break;
            case Model.ModelTypeId.SequenceType:
                this.visitSequenceType(node);
                break;
            case Model.ModelTypeId.OptionType:
                this.visitOptionType(node);
                break;
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
