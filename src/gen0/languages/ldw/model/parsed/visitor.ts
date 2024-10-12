import * as Model from './model';

export class Visitor {
    visitModel(node: Model.Model): void {
        node.values.forEach((x) => {
            switch (x.modelType) {
                case Model.ModelType.Definition:
                    this.visitDefinition(x);
                    break;
                case Model.ModelType.Deletion:
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
                case Model.ModelType.MemberDeletion:
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
            case Model.ModelType.ProductMember:
                this.visitProductMember(node.value);
                break;
            default:
                this.visitType(node.value);
                break;
        }
    }

    visitType(node: Model.Type): void {
        switch (node.modelType) {
            case Model.ModelType.VoidType:
                this.visitVoidType(node);
                break;
            case Model.ModelType.PrimitiveType:
                this.visitPrimitiveType(node);
                break;
            case Model.ModelType.EnumType:
                this.visitEnumType(node);
                break;
            case Model.ModelType.NamedTypeReference:
                this.visitNamedTypeReference(node);
                break;
            case Model.ModelType.SumType:
            case Model.ModelType.ProductType:
            case Model.ModelType.TupleType:
            case Model.ModelType.MapType:
            case Model.ModelType.SetType:
            case Model.ModelType.SequenceType:
            case Model.ModelType.OptionType:
                this.visitTypeWithStructure(node);
                break;
        }
    }

    visitVoidType(node: Model.VoidType): void {}

    visitPrimitiveType(node: Model.PrimitiveType): void {}

    visitEnumType(node: Model.EnumType): void {}

    visitTypeWithStructure(node: Model.TypeWithStructure): void {
        switch (node.modelType) {
            case Model.ModelType.SumType:
                this.visitSumType(node);
                break;
            case Model.ModelType.ProductType:
                this.visitProductType(node);
                break;
            case Model.ModelType.TupleType:
            case Model.ModelType.MapType:
            case Model.ModelType.SetType:
            case Model.ModelType.SequenceType:
            case Model.ModelType.OptionType:
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
            case Model.ModelType.TupleType:
                this.visitTupleType(node);
                break;
            case Model.ModelType.MapType:
                this.visitMapType(node);
                break;
            case Model.ModelType.SetType:
                this.visitSetType(node);
                break;
            case Model.ModelType.SequenceType:
                this.visitSequenceType(node);
                break;
            case Model.ModelType.OptionType:
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
