import { pascalCase } from 'literal-case';
import { singular } from 'pluralize';
import { IndentingOutputStream } from '../../../../../output/indentingOutputStream';
import * as Model from '../model';
import assert from 'assert';

export class DiscriminatedModelToTypescriptBuilderSource {
    transform(model: Model.Model): string {
        const output = new IndentingOutputStream();
        new Generator(model, output).generate();
        return output.toString().trim();
    }
}

class Generator {
    constructor(
        public model: Model.Model,
        public output: IndentingOutputStream
    ) {}

    generate() {
        this.output.writeLine('import * as Model from "./model";');
        this.output.writeLine();

        this.generateBuildableEnum();
        this.generateFieldEnums();
        this.generateBuilder();
    }

    perBuildable(callback: (definition: Model.Definition) => void): void {
        this.model.definitions.forEach((definition) => {
            if (definition.type.discriminator === Model.Discriminator.ProductType) {
                callback(definition);
            }
        });
    }

    perBuildableField(definition: Model.Definition, callback: (fieldName: string, type: Model.Type) => void): void {
        assert(definition.type.discriminator === Model.Discriminator.ProductType);
        definition.type.members.forEach((member) => {
            if (Model.isSequenceType(member.type)) {
                callback(singular(member.name), member.type.elementType);
            }
            callback(member.name, member.type);
        });
    }

    generateBuildableEnum() {
        this.output.writeLine('enum Buildable {');
        this.perBuildable((definition) => {
            this.output.writeLine(`${pascalCase(definition.name)}, `);
        });
        this.output.writeLine('}');
        this.output.writeLine();
    }

    generateFieldEnums() {
        this.perBuildable((definition) => {
            this.output.writeLine(`enum ${pascalCase(definition.name)}Field {`);
            this.perBuildableField(definition, (fieldName, type) => {
                this.output.writeLine(`${pascalCase(singular(fieldName))},`);
            });
            this.output.writeLine('}');
            this.output.writeLine();
        });
    }

    generateBuilder() {
        this.output.writeLine('export class Builder {');
        this.output.indentDuring(() => {
            this.output.writeLine();
            this.output.writeLine('mark(): Mark {}');
            this.output.writeLine('restore(mark: Mark) {}');
            this.output.writeLine();

            // Per buildable
            this.output.writeLine(`startDDD(): void {`);
            this.output.writeLine(`}`);
            this.output.writeLine();

            // Return union of buildable types
            this.output.writeLine(`finalise(): void {`);
            this.output.writeLine(`}`);
            this.output.writeLine();

            // Per field name
            this.output.writeLine(`setFFF(): void {`);
            this.output.writeLine(`}`);
            this.output.writeLine();

            // Per definition+field type
            this.output.writeLine(`setDDDFFF(): void {`);
            this.output.writeLine(`}`);
            this.output.writeLine();

            this.output.writeLine('instructions: Instruction[] = [];');
            this.output.writeLine();
        });
        this.output.writeLine('}');
        this.output.writeLine();

        this.output.writeLine('interface Mark {');
        this.output.writeLine('instructionsLength: number');
        this.output.writeLine('typeStackLength: number');
        this.output.writeLine('}');
        this.output.writeLine();

        this.output.writeLine('type Instruction = SetInstruction | ExplicitSetInstruction | StartInstruction;');
        this.output.writeLine();

        this.generateStartInstructions();
        this.generateSetInstructions();
        this.generateExplicitSetInstructions();
    }

    generateStartInstructions() {}

    generateSetInstructions() {}

    generateExplicitSetInstructions() {}
}
