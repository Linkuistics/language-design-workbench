import { camelCase, pascalCase } from 'literal-case';
import { Registry } from '../../../../../nanopass/registry';
import { IndentingOutputStream } from '../../../../../output/indentingOutputStream';
import { Definition, Discriminator, EnumType, Model, NamedTypeReference, ProductType, SumType } from '../model';
import { typeAsTypescript } from '../typescript';
import { Visitor } from '../visitor';

export class DiscriminatedModelToTypescriptModelSource {
    private output: IndentingOutputStream;

    constructor(public registry: Registry) {
        this.output = new IndentingOutputStream();
    }

    transform(model: Model): string {
        this.importForeignReferences(model);
        this.generateDiscriminatorEnum(model);

        model.definitions.forEach((definition) => {
            switch (definition.type.discriminator) {
                case Discriminator.SumType:
                    this.generateSumDefinition(definition, definition.type);
                    break;
                case Discriminator.ProductType:
                    this.generateProductDefinition(definition, definition.type);
                    break;
                case Discriminator.EnumType:
                    this.generateEnumDefinition(definition, definition.type);
                    break;
                default:
                    this.output.write(`export type ${pascalCase(definition.name)} = `);
                    this.output.write(typeAsTypescript(definition.type));
                    this.output.writeLine(';');
                    break;
            }
            this.output.writeLine();
        });

        return this.output.toString().trim();
    }

    importForeignReferences(model: Model) {
        const foreignReferences = new Map<string, string>();
        new (class extends Visitor {
            visitNamedTypeReference(node: NamedTypeReference): void {
                if (node.fqn.length > 1) {
                    const namespace = pascalCase(node.fqn.slice(0, -1).join('_'));
                    const module = node.fqn.slice(0, -1).join('::');
                    foreignReferences.set(namespace, module);
                }
            }
        })().visitModel(model);

        const modelFQN = model.name.join('::');
        for (const [namespace, module] of foreignReferences) {
            const modulePath = this.registry.relativePathToModule(modelFQN, module);
            this.output.writeLine(`import * as ${namespace} from '${modulePath}/model';`);
        }

        if (foreignReferences.size > 0) {
            this.output.writeLine();
        }
    }

    generateDiscriminatorEnum(model: Model) {
        this.output.writeLine('export enum Discriminator {');
        this.output.indentDuring(() => {
            model.definitions.forEach((definition) => {
                if (definition.discriminationPeers) {
                    switch (definition.type.discriminator) {
                        case Discriminator.ProductType:
                        case Discriminator.EnumType:
                            this.output.writeLine(`${pascalCase(definition.name)} = '${pascalCase(definition.name)}',`);
                            break;
                        default:
                            break;
                    }
                }
            });
        });
        this.output.writeLine('}');
        this.output.writeLine();
    }

    generateSumDefinition(definition: Definition, sumType: SumType) {
        this.output.write(`export type ${pascalCase(definition.name)} = `);
        this.output.write(typeAsTypescript(sumType));
        this.output.writeLine(';');

        this.generateDiscriminatorFunction(definition);
    }

    generateProductDefinition(definition: Definition, productType: ProductType) {
        this.output.writeLine(`export class ${pascalCase(definition.name)} {`);
        this.output.indentDuring(() => {
            this.generateDiscriminatorField(definition);

            productType.members.forEach((member) => {
                this.output.write(`public ${camelCase(member.name)}: `);
                this.output.write(typeAsTypescript(member.type));
                this.output.writeLine(';');
            });
            this.output.writeLine();
            if (productType.members.length > 0) {
                this.output.writeLine('constructor(init: {');
                this.output.indentDuring(() => {
                    this.output.join(productType.members, ',\n', (member) => {
                        const opt = member.type.discriminator === Discriminator.OptionType ? '?' : '';
                        this.output.write(`${camelCase(member.name)}${opt}: `);
                        this.output.write(typeAsTypescript(member.type));
                    });
                    this.output.writeLine();
                });
                this.output.writeLine('}) {');
                this.output.indentDuring(() => {
                    productType.members.forEach((member) => {
                        this.output.writeLine(`this.${camelCase(member.name)} = init.${camelCase(member.name)};`);
                    });
                });
                this.output.writeLine('}');
            }
        });
        this.output.writeLine('}');

        this.generateDiscriminatorFunction(definition);
    }

    generateEnumDefinition(definition: Definition, enumType: EnumType) {
        this.output.writeLine(`export enum ${pascalCase(definition.name)}Enum {`);
        this.output.indentDuring(() => {
            this.output.join(enumType.members, ',\n', (member, index) => {
                this.output.write(`${pascalCase(member)} = '${pascalCase(member)}'`);
            });
            this.output.writeLine();
        });
        this.output.writeLine('}');

        this.output.writeLine(`export class ${pascalCase(definition.name)} {`);
        this.output.indentDuring(() => {
            this.generateDiscriminatorField(definition);

            enumType.members.forEach((member) => {
                this.output.writeLine(
                    `static ${pascalCase(member)}: ${pascalCase(definition.name)} = new ${pascalCase(definition.name)}(${pascalCase(definition.name)}Enum.${pascalCase(member)});`
                );
            });
            this.output.writeLine();
            this.output.writeLine(`private constructor(public readonly value: ${pascalCase(definition.name)}Enum) {}`);
        });
        this.output.writeLine('}');

        this.generateDiscriminatorFunction(definition);
    }

    generateDiscriminatorField(definition: Definition) {
        if (definition.discriminationPeers) {
            this.output.writeLine(`readonly discriminator = Discriminator.${pascalCase(definition.name)};`);
            this.output.writeLine();
        }
    }

    generateDiscriminatorFunction(definition: Definition) {
        if (definition.discriminationPeers) {
            const values = [...definition.discriminationPeers.values()];
            const valueType = values.map((value) => pascalCase(value)).join(' | ');
            this.output.writeLine(
                `export function is${pascalCase(definition.name)}(value: ${valueType} ): value is ${pascalCase(
                    definition.name
                )} {`
            );

            if (definition.discriminationMembers) {
                this.output.indentDuring(() => {
                    this.output.writeLine('switch (value.discriminator) {');
                    this.output.indentDuring(() => {
                        this.output.indentDuring(() => {
                            definition.discriminationMembers!.forEach((member) => {
                                this.output.writeLine(`case Discriminator.${pascalCase(member)}:`);
                            });
                            this.output.writeLine('return true;');
                        });
                        this.output.writeLine('default:');
                        this.output.indentDuring(() => {
                            this.output.writeLine('return false;');
                        });
                    });
                    this.output.writeLine('}');
                });
            } else {
                this.output.indentDuring(() => {
                    this.output.writeLine(
                        `return value.discriminator === Discriminator.${pascalCase(definition.name)};`
                    );
                });
            }
            this.output.writeLine('}');
        }
    }
}
