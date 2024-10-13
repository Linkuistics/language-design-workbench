import * as Model from './model';

export class Visitor {
    visitBlockComment(node: Model.BlockComment): void {}

    visitDefinition(node: Model.Definition): void {
        this.visitType(node.type);
    }

    visitDeletion(node: Model.Deletion): void {}

    visitEnumType(node: Model.EnumType): void {}

    visitFqn(node: Model.Fqn): void {}

    visitGenericType(node: Model.GenericType): void {
        if (node instanceof Model.TupleType) {
            this.visitTupleType(node);
        }
        if (node instanceof Model.MapType) {
            this.visitMapType(node);
        }
        if (node instanceof Model.SetType) {
            this.visitSetType(node);
        }
        if (node instanceof Model.SequenceType) {
            this.visitSequenceType(node);
        }
        if (node instanceof Model.OptionType) {
            this.visitOptionType(node);
        }
    }

    visitLineComment(node: Model.LineComment): void {}

    visitMapType(node: Model.MapType): void {
        this.visitType(node.keyType);
        this.visitType(node.valueType);
    }

    visitMemberAddition(node: Model.MemberAddition): void {
        if (node instanceof Model.ProductMember) {
            this.visitProductMember(node);
        }
        if (node instanceof Model.VoidType) {
            this.visitType(node);
        }
        if (node instanceof Model.EnumType) {
            this.visitType(node);
        }
        if (node instanceof Model.SumType) {
            this.visitType(node);
        }
        if (node instanceof Model.ProductType) {
            this.visitType(node);
        }
        if (node instanceof Model.TupleType) {
            this.visitType(node);
        }
        if (node instanceof Model.MapType) {
            this.visitType(node);
        }
        if (node instanceof Model.SetType) {
            this.visitType(node);
        }
        if (node instanceof Model.SequenceType) {
            this.visitType(node);
        }
        if (node instanceof Model.OptionType) {
            this.visitType(node);
        }
        if (node instanceof Model.NamedTypeReference) {
            this.visitType(node);
        }
    }

    visitMemberDeletion(node: Model.MemberDeletion): void {}

    visitMemberModification(node: Model.MemberModification): void {}

    visitModel(node: Model.Model): void {
        this.visitFqn(node.name);
    }

    visitNamedTypeReference(node: Model.NamedTypeReference): void {
        this.visitFqn(node.fqn);
    }

    visitOptionType(node: Model.OptionType): void {
        this.visitType(node.type);
    }

    visitProductMember(node: Model.ProductMember): void {
        this.visitType(node.type);
    }

    visitProductType(node: Model.ProductType): void {
        node.members.forEach((x) => {
            this.visitProductMember(x);
        });
    }

    visitSequenceType(node: Model.SequenceType): void {
        this.visitType(node.elementType);
    }

    visitSetType(node: Model.SetType): void {
        this.visitType(node.keyType);
    }

    visitSumType(node: Model.SumType): void {
        node.members.forEach((x) => {
            this.visitType(x);
        });
    }

    visitTrivia(node: Model.Trivia): void {
        if (node instanceof Model.LineComment) {
            this.visitLineComment(node);
        }
        if (node instanceof Model.BlockComment) {
            this.visitBlockComment(node);
        }
        if (node instanceof Model.Whitespace) {
            this.visitWhitespace(node);
        }
    }

    visitTupleType(node: Model.TupleType): void {
        node.members.forEach((x) => {
            this.visitType(x);
        });
    }

    visitType(node: Model.Type): void {
        if (node instanceof Model.VoidType) {
            this.visitVoidType(node);
        }
        if (node instanceof Model.EnumType) {
            this.visitEnumType(node);
        }
        if (node instanceof Model.SumType) {
            this.visitTypeWithStructure(node);
        }
        if (node instanceof Model.ProductType) {
            this.visitTypeWithStructure(node);
        }
        if (node instanceof Model.TupleType) {
            this.visitTypeWithStructure(node);
        }
        if (node instanceof Model.MapType) {
            this.visitTypeWithStructure(node);
        }
        if (node instanceof Model.SetType) {
            this.visitTypeWithStructure(node);
        }
        if (node instanceof Model.SequenceType) {
            this.visitTypeWithStructure(node);
        }
        if (node instanceof Model.OptionType) {
            this.visitTypeWithStructure(node);
        }
        if (node instanceof Model.NamedTypeReference) {
            this.visitNamedTypeReference(node);
        }
    }

    visitTypeWithStructure(node: Model.TypeWithStructure): void {
        if (node instanceof Model.SumType) {
            this.visitSumType(node);
        }
        if (node instanceof Model.ProductType) {
            this.visitProductType(node);
        }
        if (node instanceof Model.TupleType) {
            this.visitGenericType(node);
        }
        if (node instanceof Model.MapType) {
            this.visitGenericType(node);
        }
        if (node instanceof Model.SetType) {
            this.visitGenericType(node);
        }
        if (node instanceof Model.SequenceType) {
            this.visitGenericType(node);
        }
        if (node instanceof Model.OptionType) {
            this.visitGenericType(node);
        }
    }

    visitVoidType(node: Model.VoidType): void {}

    visitWhitespace(node: Model.Whitespace): void {}
}
