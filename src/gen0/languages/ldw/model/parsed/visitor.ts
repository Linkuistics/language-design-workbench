import * as Model from './model';

export class Visitor {
    visitModel(node: Model.Model): void {
        node.values.forEach((x) => {
            switch (x.discriminator) {
                case Model.Discriminator.Definition:
                    this.visitDefinition(x);
                    break;
                case Model.Discriminator.Deletion:
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
            switch (x.discriminator) {
                case Model.Discriminator.MemberDeletion:
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
        switch (node.value.discriminator) {
            case Model.Discriminator.ProductMember:
                this.visitProductMember(node.value);
                break;
            default:
                this.visitType(node.value);
                break;
        }
    }

    visitType(node: Model.Type): void {
        switch (node.discriminator) {
            case Model.Discriminator.VoidType:
                this.visitVoidType(node);
                break;
            case Model.Discriminator.PrimitiveType:
                this.visitPrimitiveType(node);
                break;
            case Model.Discriminator.EnumType:
                this.visitEnumType(node);
                break;
            case Model.Discriminator.NamedTypeReference:
                this.visitNamedTypeReference(node);
                break;
            case Model.Discriminator.SumType:
            case Model.Discriminator.ProductType:
            case Model.Discriminator.TupleType:
            case Model.Discriminator.MapType:
            case Model.Discriminator.SetType:
            case Model.Discriminator.SequenceType:
            case Model.Discriminator.OptionType:
                this.visitTypeWithStructure(node);
                break;
        }
    }

    visitVoidType(node: Model.VoidType): void {}

    visitPrimitiveType(node: Model.PrimitiveType): void {}

    visitEnumType(node: Model.EnumType): void {}

    visitTypeWithStructure(node: Model.TypeWithStructure): void {
        switch (node.discriminator) {
            case Model.Discriminator.SumType:
                this.visitSumType(node);
                break;
            case Model.Discriminator.ProductType:
                this.visitProductType(node);
                break;
            case Model.Discriminator.TupleType:
            case Model.Discriminator.MapType:
            case Model.Discriminator.SetType:
            case Model.Discriminator.SequenceType:
            case Model.Discriminator.OptionType:
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
        switch (node.discriminator) {
            case Model.Discriminator.TupleType:
                this.visitTupleType(node);
                break;
            case Model.Discriminator.MapType:
                this.visitMapType(node);
                break;
            case Model.Discriminator.SetType:
                this.visitSetType(node);
                break;
            case Model.Discriminator.SequenceType:
                this.visitSequenceType(node);
                break;
            case Model.Discriminator.OptionType:
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
