import { camelCase, pascalCase } from 'literal-case';
import { Registry } from '../../../../../nanopass/registry';
import { IndentingOutputStream } from '../../../../../output/indentingOutputStream';
import {
    Definition,
    Discriminator,
    EnumType,
    Fqn,
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
    VoidType
} from '../model';
import { Visitor } from '../visitor';
import { hostname } from 'os';

export class ParsedModelToTypesTypescriptSource extends Visitor {
    private output: IndentingOutputStream;

    constructor(
        public registry: Registry,
        public useGenerics: boolean
    ) {
        super();
        this.output = new IndentingOutputStream();
    }

    transform(model: Model): string {
        this.visitModel(model);
        return this.output.toString().trim();
    }

    visitModel(node: Model): void {
        const foreignReferences = new Map<string, string>();
        new (class extends Visitor {
            visitNamedTypeReference(node: NamedTypeReference): void {
                if (node.fqn.length > 1) {
                    const namespace = pascalCase(node.fqn.slice(0, -1).join('_'));
                    const module = node.fqn.slice(0, -1).join('::');
                    foreignReferences.set(namespace, module);
                }
            }
        })().visitModel(node);

        const modelFQN = node.name.join('::');
        for (const [namespace, module] of foreignReferences) {
            const modulePath = this.registry.relativePathToModule(modelFQN, module);
            this.output.writeLine(`import * as ${namespace} from '${modulePath}/model';`);
        }

        if (foreignReferences.size > 0) {
            this.output.writeLine();
        }

        if (this.useGenerics) {
            this.output.writeLine('type Option<T> = T | undefined;');
            this.output.writeLine();
        }

        this.output.writeLine('export enum Discriminator {');
        this.output.indentDuring(() => {
            node.definitions.forEach((definition) => {
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

        super.visitModel(node);
    }

    visitDefinition(definition: Definition) {
        if (definition.type instanceof ProductType) {
            const productType = definition.type as ProductType;
            this.output.writeLine(`export class ${pascalCase(definition.name)} {`);
            this.output.indentDuring(() => {
                if (definition.discriminationPeers) {
                    this.output.writeLine(`readonly discriminator = Discriminator.${pascalCase(definition.name)};`);
                    this.output.writeLine();
                }
                productType.members.forEach((member) => {
                    this.output.write(`public ${camelCase(member.name)}: `);
                    this.visitType(member.type);
                    this.output.writeLine(';');
                });
                this.output.writeLine();
                if (productType.members.length > 0) {
                    this.output.writeLine('constructor(init: {');
                    this.output.indentDuring(() => {
                        this.output.join(productType.members, ',\n', (member) => {
                            const opt = member.type.discriminator === Discriminator.OptionType ? '?' : '';
                            this.output.write(`${camelCase(member.name)}${opt}: `);
                            this.visitType(member.type);
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
            if (definition.discriminationPeers) {
                const values = [...definition.discriminationPeers.values()];
                const valueType = values.map((value) => pascalCase(value)).join(' | ');
                this.output.writeLine(
                    `export function is${pascalCase(definition.name)}(value: ${valueType} ): value is ${pascalCase(
                        definition.name
                    )} {`
                );
                this.output.indentDuring(() => {
                    this.output.writeLine(
                        `return value.discriminator === Discriminator.${pascalCase(definition.name)};`
                    );
                });
                this.output.writeLine('}');
            }
        } else if (definition.type instanceof EnumType) {
            const enumType = definition.type as EnumType;
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
                if (definition.discriminationPeers) {
                    this.output.writeLine(`readonly discriminator = Discriminator.${pascalCase(definition.name)};`);
                    this.output.writeLine();
                }
                enumType.members.forEach((member) => {
                    this.output.writeLine(
                        `static ${pascalCase(member)}: ${pascalCase(definition.name)} = new ${pascalCase(definition.name)}(${pascalCase(definition.name)}Enum.${pascalCase(member)});`
                    );
                });
                this.output.writeLine();
                this.output.writeLine(
                    `private constructor(public readonly value: ${pascalCase(definition.name)}Enum) {}`
                );
            });
            this.output.writeLine('}');
            if (definition.discriminationPeers) {
                const values = [...definition.discriminationPeers.values()];
                const valueType = values.map((value) => pascalCase(value)).join(' | ');
                this.output.writeLine(
                    `export function is${pascalCase(definition.name)}(value: ${valueType} ): value is ${pascalCase(
                        definition.name
                    )} {`
                );
                this.output.indentDuring(() => {
                    this.output.writeLine(
                        `return value.discriminator === Discriminator.${pascalCase(definition.name)};`
                    );
                });
                this.output.writeLine('}');
            }
        } else if (definition.type instanceof SumType) {
            this.output.write(`export type ${pascalCase(definition.name)} = `);
            this.visitType(definition.type);
            this.output.writeLine(';');
            if (definition.discriminationPeers) {
                const values = [...definition.discriminationPeers.values()];
                const valueType = values.map((value) => pascalCase(value)).join(' | ');
                this.output.writeLine(
                    `export function is${pascalCase(definition.name)}(value: ${valueType} ): value is ${pascalCase(
                        definition.name
                    )} {`
                );
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
                this.output.writeLine('}');
            }
        } else {
            this.output.write(`export type ${pascalCase(definition.name)} = `);
            this.visitType(definition.type);
            this.output.writeLine(';');
        }
        this.output.writeLine();
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
        if (this.useGenerics) {
            this.output.write('Array<');
            this.visitType(sequenceType.elementType);
            this.output.write('>');
        } else {
            if (sequenceType.elementType instanceof OptionType || sequenceType.elementType instanceof SumType) {
                this.output.write('(');
                this.visitType(sequenceType.elementType);
                this.output.write(')');
            } else {
                this.visitType(sequenceType.elementType);
            }
            this.output.write('[]');
        }
    }

    visitOptionType(optionType: OptionType) {
        if (this.useGenerics) {
            this.output.write('Option<');
            this.visitType(optionType.type);
            this.output.write('>');
        } else {
            this.visitType(optionType.type);
            this.output.write(' | undefined');
        }
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
