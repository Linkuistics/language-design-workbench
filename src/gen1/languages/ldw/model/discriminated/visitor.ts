// Generated on 2024-10-15T13:55:46.903Z by Bach.local at /Users/antony/Development/Linkuistics/language-design-workbench

import * as Model from './model';

export class Visitor {
    visitModel(node: Model.Model): void {
        this.visitFqn(node.name);
        if (node.parent != undefined) {
            this.visitModel(node.parent);
        }
        node.definitions.forEach((x) => {
            this.visitDefinition(x);
        });
    }

    visitFqn(node: Model.Fqn): void {}

    visitDefinition(node: Model.Definition): void {
        this.visitType(node.type);
        if (node.discriminationPeers != undefined) {
        }
        if (node.discriminationMembers != undefined) {
        }
    }

    visitType(node: Model.Type): void {
        if (node instanceof Model.VoidType) {
            this.visitVoidType(node);
        } else if (node instanceof Model.EnumType) {
            this.visitEnumType(node);
        } else if (node instanceof Model.SumType) {
            this.visitTypeWithStructure(node);
        } else if (node instanceof Model.ProductType) {
            this.visitTypeWithStructure(node);
        } else if (node instanceof Model.TupleType) {
            this.visitTypeWithStructure(node);
        } else if (node instanceof Model.MapType) {
            this.visitTypeWithStructure(node);
        } else if (node instanceof Model.SetType) {
            this.visitTypeWithStructure(node);
        } else if (node instanceof Model.SequenceType) {
            this.visitTypeWithStructure(node);
        } else if (node instanceof Model.OptionType) {
            this.visitTypeWithStructure(node);
        } else if (node instanceof Model.NamedTypeReference) {
            this.visitNamedTypeReference(node);
        }
    }

    visitVoidType(node: Model.VoidType): void {}

    visitEnumType(node: Model.EnumType): void {}

    visitTypeWithStructure(node: Model.TypeWithStructure): void {
        if (node instanceof Model.SumType) {
            this.visitSumType(node);
        } else if (node instanceof Model.ProductType) {
            this.visitProductType(node);
        } else if (node instanceof Model.TupleType) {
            this.visitGenericType(node);
        } else if (node instanceof Model.MapType) {
            this.visitGenericType(node);
        } else if (node instanceof Model.SetType) {
            this.visitGenericType(node);
        } else if (node instanceof Model.SequenceType) {
            this.visitGenericType(node);
        } else if (node instanceof Model.OptionType) {
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
        } else if (node instanceof Model.OptionType) {
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

    visitNamedTypeReference(node: Model.NamedTypeReference): void {
        this.visitFqn(node.fqn);
    }

    visitTrivia(node: Model.Trivia): void {
        if (node instanceof Model.LineComment) {
            this.visitLineComment(node);
        } else if (node instanceof Model.BlockComment) {
            this.visitBlockComment(node);
        } else if (node instanceof Model.Whitespace) {
            this.visitWhitespace(node);
        }
    }

    visitWhitespace(node: Model.Whitespace): void {}

    visitLineComment(node: Model.LineComment): void {}

    visitBlockComment(node: Model.BlockComment): void {}
}
