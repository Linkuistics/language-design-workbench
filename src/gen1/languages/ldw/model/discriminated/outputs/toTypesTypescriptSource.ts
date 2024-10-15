import { camelCase, pascalCase } from 'literal-case';
import { Registry } from '../../../../../nanopass/registry';
import { IndentingOutputStream } from '../../../../../output/indentingOutputStream';
import {
    Definition,
    Discriminator,
    EnumType,
    MapType,
    Model,
    NamedTypeReference,
    OptionType,
    PrimitiveType,
    ProductType,
    SequenceType,
    SetType,
    SumType,
    TupleType,
    Type,
    VoidType
} from '../model';
import { Visitor } from '../visitor';

export class ParsedModelToTypesTypescriptSource {
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
                    this.generateType(definition.type);
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
        this.generateType(sumType);
        this.output.writeLine(';');

        this.generateDiscriminatorFunction(definition);
    }

    generateProductDefinition(definition: Definition, productType: ProductType) {
        this.output.writeLine(`export class ${pascalCase(definition.name)} {`);
        this.output.indentDuring(() => {
            this.generateDiscriminatorField(definition);

            productType.members.forEach((member) => {
                this.output.write(`public ${camelCase(member.name)}: `);
                this.generateType(member.type);
                this.output.writeLine(';');
            });
            this.output.writeLine();
            if (productType.members.length > 0) {
                this.output.writeLine('constructor(init: {');
                this.output.indentDuring(() => {
                    this.output.join(productType.members, ',\n', (member) => {
                        const opt = member.type.discriminator === Discriminator.OptionType ? '?' : '';
                        this.output.write(`${camelCase(member.name)}${opt}: `);
                        this.generateType(member.type);
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

    generateType(type: Type) {
        new TypeGenerator(this.output).visitType(type);
    }
}

class TypeGenerator extends Visitor {
    constructor(public output: IndentingOutputStream) {
        super();
    }

    visitVoidType(voidType: VoidType) {
        this.output.write('void');
    }

    visitPrimitiveType(primitiveType: PrimitiveType) {
        switch (primitiveType) {
            case PrimitiveType.Boolean:
                this.output.write('boolean');
                break;
            case PrimitiveType.Char:
            case PrimitiveType.String:
                this.output.write('string');
                break;
            default:
                this.output.write('number');
                break;
        }
    }

    visitEnumType(enumType: EnumType) {
        this.output.join(enumType.members, ' | ', (member) => {
            this.output.write(`"${pascalCase(member)}"`);
        });
    }

    visitSumType(sumType: SumType) {
        this.output.join(sumType.members, ' | ', (member) => {
            this.visitType(member);
        });
    }

    visitProductType(productType: ProductType) {
        this.output.write('{ ');
        this.output.join(productType.members, ', ', (member) => {
            this.output.write(`${camelCase(member.name)}: `);
            this.visitType(member.type);
        });
        this.output.write(' }');
    }

    visitTupleType(tupleType: TupleType) {
        this.output.write('[');
        this.output.join(tupleType.members, ', ', (member) => {
            this.visitType(member);
        });
        this.output.write(']');
    }

    visitMapType(mapType: MapType) {
        this.output.write('Map<');
        this.visitType(mapType.keyType);
        this.output.write(', ');
        this.visitType(mapType.valueType);
        this.output.write('>');
    }

    visitSetType(setType: SetType) {
        this.output.write('Set<');
        this.visitType(setType.keyType);
        this.output.write('>');
    }

    visitSequenceType(sequenceType: SequenceType) {
        if (sequenceType.elementType instanceof OptionType || sequenceType.elementType instanceof SumType) {
            this.output.write('(');
            this.visitType(sequenceType.elementType);
            this.output.write(')');
        } else {
            this.visitType(sequenceType.elementType);
        }
        this.output.write('[]');
    }

    visitOptionType(optionType: OptionType) {
        this.visitType(optionType.type);
        this.output.write(' | undefined');
    }

    visitNamedTypeReference(namedTypeReference: NamedTypeReference) {
        if (namedTypeReference.fqn.length > 1) {
            const namespace = pascalCase(namedTypeReference.fqn.slice(0, -1).join('_'));
            this.output.write(`${namespace}.`);
        }
        const typeName = pascalCase(namedTypeReference.fqn[namedTypeReference.fqn.length - 1]);
        this.output.write(typeName);
    }
}
