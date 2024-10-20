import { camelCase, pascalCase } from 'literal-case';
import pluralize from 'pluralize';
import { IndentingOutputStream } from '../../../../../output/indentingOutputStream';
import {
    Definition,
    Discriminator,
    EnumType,
    MapType,
    Model,
    NamedTypeReference,
    OptionType,
    ProductMember,
    ProductType,
    SequenceType,
    SumType
} from '../model';
import { Visitor } from '../visitor';

export class DiscriminatedModelToTypescriptVisitorSource {
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
        model.definitions.forEach((definition) => {
            if (definition.type instanceof ProductType) {
                this.visitableDefinitions.set(definition.name, definition);
            } else if (definition.type instanceof SumType) {
                this.visitableDefinitions.set(definition.name, definition);
            } else if (definition.type instanceof EnumType) {
                this.visitableDefinitions.set(definition.name, definition);
            }
        });

        // Fixed point reachability
        let changes;
        do {
            changes = false;
            model.definitions.forEach((definition) => {
                if (definition.type instanceof SequenceType || definition.type instanceof OptionType) {
                    if (!this.visitableDefinitions.has(definition.name)) {
                        this.visitableDefinitions.set(definition.name, definition);
                        changes = true;
                    }
                }
            });
        } while (changes);
    }

    visitModel(model: Model): void {
        model.definitions.forEach((definition) => {
            this.definitions.set(definition.name, definition);
        });
        this.collectVisitableDefinitions(model);

        this.output.writeLine('import * as Model from "./model";');
        this.output.writeLine();
        this.output.writeLine('export class Visitor {');
        this.output.writeLine();
        this.output.indentDuring(() => {
            model.definitions.forEach((definition) => {
                if (this.visitableDefinitions.has(definition.name)) {
                    this.visitDefinition(definition);
                }
            });
        });
        this.output.writeLine('}');
    }

    valueName: string = '';

    visitDefinition(definition: Definition): void {
        this.output.writeLine(
            `visit${pascalCase(definition.name)}(node: Model.${pascalCase(definition.name)}): void {`
        );
        this.valueName = 'node';
        this.output.indentDuring(() => super.visitDefinition(definition));
        this.output.writeLine('}');
        this.output.writeLine();
    }

    visitSumType(sumType: SumType): void {
        this.output.writeLine(`switch (${this.valueName}.discriminator) {`);
        this.output.indentDuring(() => {
            sumType.members.forEach((member) => {
                if (member instanceof NamedTypeReference) {
                    const name = member.fqn[member.fqn.length - 1];
                    const definition = this.definitions.get(name)!;
                    if (definition.discriminationMembers) {
                        definition.discriminationMembers.forEach((member) => {
                            this.output.writeLine(`case Model.Discriminator.${pascalCase(member)}:`);
                        });
                    } else {
                        this.output.writeLine(`case Model.Discriminator.${pascalCase(name)}:`);
                    }
                    this.output.indentDuring(() => {
                        this.output.writeLine(`this.visit${pascalCase(name)}(${this.valueName});`);
                        this.output.writeLine(`break`);
                    });
                }
            });
        });
        this.output.writeLine(`}`);
    }

    visitProductMember(productMember: ProductMember): void {
        const oldValueName = this.valueName;
        if (productMember.type.discriminator === Discriminator.SequenceType) {
            this.valueName = `${this.valueName}.${pluralize(camelCase(productMember.name))}`;
        } else {
            this.valueName = `${this.valueName}.${camelCase(productMember.name)}`;
        }
        this.visitType(productMember.type);
        this.valueName = oldValueName;
    }

    visitOptionType(optionType: OptionType): void | OptionType {
        this.output.writeLine(`if (${this.valueName} != undefined) {`);
        this.visitType(optionType.type);
        this.output.writeLine(`}`);
    }

    visitSequenceType(sequenceType: SequenceType): void | SequenceType {
        // if (
        //     sequenceType.elementType instanceof NamedTypeReference &&
        //     this.visitableDefinitions.has(sequenceType.elementType.fqn[sequenceType.elementType.fqn.length - 1])
        // ) {
        this.output.writeLine(`${this.valueName}.forEach(x => {`);
        let oldValueName = this.valueName;
        this.valueName = 'x';
        this.output.indentDuring(() => {
            this.visitType(sequenceType.elementType);
        });
        this.valueName = oldValueName;
        this.output.writeLine(`})`);
        // }
    }

    visitMapType(mapType: MapType): void | MapType {
        if (
            mapType.valueType instanceof NamedTypeReference &&
            this.visitableDefinitions.has(mapType.valueType.fqn[mapType.valueType.fqn.length - 1])
        ) {
            this.output.writeLine(`${pluralize(this.valueName)}.forEach(x => {`);
            let oldValueName = this.valueName;
            this.valueName = 'x';
            this.output.indentDuring(() => {
                this.visitType(mapType.valueType);
            });
            this.valueName = oldValueName;
            this.output.writeLine(`})`);
        }
    }

    visitNamedTypeReference(namedTypeReference: NamedTypeReference): void | NamedTypeReference {
        const name = namedTypeReference.fqn[namedTypeReference.fqn.length - 1];
        if (this.visitableDefinitions.has(name)) {
            this.output.writeLine(`this.visit${pascalCase(name)}(${this.valueName});`);
        }
    }
}
