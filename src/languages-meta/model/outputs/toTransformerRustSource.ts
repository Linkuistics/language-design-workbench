import { camelCase, pascalCase } from 'literal-case';
import pluralize from 'pluralize';
import { IndentingOutputStream } from '../../../output/indentingOutputStream';
import {
    Definition,
    Model,
    NamedTypeReference,
    OptionType,
    ProductMember,
    ProductType,
    SequenceType,
    SumType
} from '../model';
import { Visitor } from '../visitor';

export class ModelToTransformerRustSource {
    transform(model: Model): string {
        const generator = new TopLevelGenerator();
        generator.visitModel(model);
        return generator.output.toString().trim();
    }
}

class TopLevelGenerator extends Visitor {
    definitions = new Map<string, Definition>();
    visitableDefinitions = new Map<string, Definition>();
    output = new IndentingOutputStream();

    collectVisitableDefinitions(model: Model) {
        model.values.forEach((definition) => {
            if (definition instanceof Definition) {
                if (definition.type instanceof ProductType) {
                    this.visitableDefinitions.set(definition.name, definition);
                } else if (definition.type instanceof SumType) {
                    this.visitableDefinitions.set(definition.name, definition);
                }
            }
        });

        // Fixed point reachability
        let changes;
        do {
            changes = false;
            model.values.forEach((definition) => {
                if (definition instanceof Definition) {
                    if (definition.type instanceof SequenceType || definition.type instanceof OptionType) {
                        if (!this.visitableDefinitions.has(definition.name)) {
                            this.visitableDefinitions.set(definition.name, definition);
                            changes = true;
                        }
                    }
                }
            });
        } while (changes);
    }

    visitModel(model: Model): void {
        model.values.forEach((definition) => {
            if (definition instanceof Definition) {
                this.definitions.set(definition.name, definition);
            }
        });
        this.collectVisitableDefinitions(model);

        // this.output.writeLine('import * as Model from "./model";');
        // this.output.writeLine();
        // this.output.writeLine('export class Transformer {');
        // this.output.writeLine();
        // this.output.indentDuring(() => {
        //     model.values.forEach((value) => {
        //         if (value instanceof Definition && this.visitableDefinitions.has(value.name)) {
        //             this.visitDefinition(value);
        //         }
        //     });
        // });
        // this.output.writeLine('}');
    }

    visitDefinition(definition: Definition): void {
        this.output.writeLine(
            `visit${pascalCase(definition.name)}(node: Model.${pascalCase(definition.name)}): void {`
        );
        this.output.indentDuring(() => super.visitDefinition(definition));
        this.output.writeLine('}');
        this.output.writeLine();
    }

    visitSumType(sumType: SumType): void {
        sumType.members.forEach((member) => {
            if (member instanceof NamedTypeReference) {
                const name = member.names[member.names.length - 1];
                this.generateDispatcher(member, `this.visit${pascalCase(name)}(node);`);
            }
        });
    }

    generateDispatcher(type: NamedTypeReference, body: string) {
        const name = type.names[type.names.length - 1];
        const definition = this.visitableDefinitions.get(name);
        if (!definition) return;
        if (definition.type instanceof ProductType) {
            this.output.writeLine(`if (node instanceof Model.${pascalCase(name)}) {`);
            this.output.indentDuring(() => {
                this.output.writeLine(body);
            });
            this.output.writeLine('}');
        } else if (definition.type instanceof SumType) {
            definition.type.members.forEach((member) => {
                if (member instanceof NamedTypeReference) {
                    this.generateDispatcher(member, body);
                }
            });
        }
    }

    valueName: string = '';

    visitProductMember(productMember: ProductMember): void {
        this.valueName = `node.${camelCase(productMember.name)}`;
        this.visitType(productMember.type);
        this.valueName = '';
    }

    visitOptionType(optionType: OptionType): void | OptionType {}

    visitSequenceType(sequenceType: SequenceType): void | SequenceType {
        if (
            sequenceType.elementType instanceof NamedTypeReference &&
            this.visitableDefinitions.has(sequenceType.elementType.names[sequenceType.elementType.names.length - 1])
        ) {
            this.output.writeLine(`${pluralize(this.valueName)}.forEach(x => {`);
            let oldValueName = this.valueName;
            this.valueName = 'x';
            this.output.indentDuring(() => {
                this.visitType(sequenceType.elementType);
            });
            this.valueName = oldValueName;
            this.output.writeLine(`})`);
        }
    }

    visitNamedTypeReference(namedTypeReference: NamedTypeReference): void | NamedTypeReference {
        const name = namedTypeReference.names[namedTypeReference.names.length - 1];
        if (this.visitableDefinitions.has(name)) {
            this.output.writeLine(`this.visit${pascalCase(name)}(${this.valueName});`);
        }
    }
}
