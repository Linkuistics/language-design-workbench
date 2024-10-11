import * as Model from "./model";

export class Visitor {

    visitModel(node: Model.Model): void {
    }
    
    visitDefinition(node: Model.Definition): void {
        this.visitType(node.type);
    }
    
    visitDeletion(node: Model.Deletion): void {
    }
    
    visitMemberModification(node: Model.MemberModification): void {
    }
    
    visitMemberDeletion(node: Model.MemberDeletion): void {
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
    
    visitVoidType(node: Model.VoidType): void {
    }
    
    visitEnumType(node: Model.EnumType): void {
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
    
    visitSumType(node: Model.SumType): void {
        node.members.forEach(x => {
            this.visitType(x);
        })
    }
    
    visitProductType(node: Model.ProductType): void {
        node.members.forEach(x => {
            this.visitProductMember(x);
        })
    }
    
    visitProductMember(node: Model.ProductMember): void {
        this.visitType(node.type);
    }
    
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
    
    visitTupleType(node: Model.TupleType): void {
        node.members.forEach(x => {
            this.visitType(x);
        })
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
    
    visitNamedTypeReference(node: Model.NamedTypeReference): void {
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
    
    visitWhitespace(node: Model.Whitespace): void {
    }
    
    visitLineComment(node: Model.LineComment): void {
    }
    
    visitBlockComment(node: Model.BlockComment): void {
    }
    
}