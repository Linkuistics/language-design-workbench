import { program } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import Ajv from 'ajv';
import { exec } from 'child_process';
import { promisify } from 'util';
import { ExtendedGrammarFromParsedGrammar } from '../languages/ldw/grammar/extended/creation/fromParsedGrammar';
import { ParsedGrammarFromSource } from '../languages/ldw/grammar/parsed/creation/fromSource';
import { TypedGrammarFromExtendedGrammar } from '../languages/ldw/grammar/typed/creation/fromExtendedGrammar';
import { GrammarWithTypesToParserTypescriptSource } from '../languages/ldw/grammar/typed//outputs/toParserTypescriptSource';
import { ParsedModelFromTypedGrammar } from '../languages/ldw/model/parsed/creation/fromTypedGrammar';
import { ParsedModelFromSource } from '../languages/ldw/model/parsed/creation/fromSource';
import { ParsedModelToSource } from '../languages/ldw/model/parsed/outputs/toSource';
import { ParsedModelToTransformerRustSource } from '../languages/ldw/model/parsed/outputs/toTransformerRustSource';
import { ParsedModelToTransformerTypescriptSource } from '../languages/ldw/model/parsed/outputs/toTransformerTypescriptSource copy';
import { ParsedModelToTypesRustSource } from '../languages/ldw/model/parsed/outputs/toTypesRustSource';
import { ParsedModelToTypesTypescriptSource } from '../languages/ldw/model/parsed/outputs/toTypesTypescriptSource';
import { ParsedModelToVisitorRustSource } from '../languages/ldw/model/parsed/outputs/toVisitorRustSource';
import { ParsedModelToVisitorTypescriptSource } from '../languages/ldw/model/parsed/outputs/toVisitorTypescriptSource';
import { composePasses } from '../nanopass/combinators';
import { ParseError } from '../parsing/parseError';

const execPromise = promisify(exec);

program.version('1.0.0').description('Language Design Workbench CLI');

const ajv = new Ajv();
const SCHEMA_PATH = path.join(__dirname, '..', 'registry-schema.json');

class IOError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'IOError';
    }
}

class ValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ValidationError';
    }
}

class Registry {
    private registry: Record<string, string>;
    private registryDir: string;

    constructor(registryPath: string) {
        const registrySource = fs.readFileSync(registryPath, 'utf-8');
        try {
            this.registry = JSON.parse(registrySource);
        } catch (error) {
            throw new SyntaxError(`Failed to parse registry JSON: ${(error as Error).message}`);
        }

        this.validateRegistry();
        this.registryDir = path.dirname(registryPath);
    }

    private validateRegistry(): void {
        const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf-8'));
        const validate = ajv.compile(schema);
        if (!validate(this.registry)) {
            throw new ValidationError(`Registry validation failed: ${ajv.errorsText(validate.errors)}`);
        }
    }

    public resolvePath(fqn: string, filename: string): string {
        if (!this.registry[fqn]) {
            throw new Error(`Module path "${fqn}" not found in registry`);
        }

        return path.resolve(this.registryDir, this.registry[fqn], `${filename}`);
    }

    public readInput(fqn: string, filename: string): string {
        const filePath = this.resolvePath(fqn, filename);
        return fs.readFileSync(filePath, 'utf-8');
    }

    public async writeOutput(fqn: string, content: string, filename: string): Promise<void> {
        const outputPath = this.resolvePath(fqn, filename);
        fs.writeFileSync(outputPath, content);
        console.log(`Output written to: ${outputPath}`);
        await this.formatOutput(outputPath);
    }

    private async formatOutput(filePath: string): Promise<void> {
        const ext = path.extname(filePath);
        if (ext === '.ts' || ext === '.js' || ext === '.json') {
            await execPromise(`npx prettier --write "${filePath}"`);
            console.log(`Prettier formatting applied to: ${filePath}`);
        } else if (ext === '.rs') {
            await execPromise(`rustfmt "${filePath}"`);
            console.log(`Rustfmt formatting applied to: ${filePath}`);
        }
    }
}

function handleError(error: unknown): never {
    if (error instanceof ParseError) {
        console.error(`Parse Error: ${error.toString()}`);
    } else if (error instanceof IOError) {
        console.error(`IO Error: ${error.message}`);
    } else if (error instanceof SyntaxError) {
        console.error(`Syntax Error: ${error.message}`);
    } else if (error instanceof ValidationError) {
        console.error(`Validation Error: ${error.message}`);
    } else if (error instanceof Error) {
        console.error(`Error: ${error.message}`);
    } else {
        console.error('An unknown error occurred:', error);
    }
    process.exit(1);
}

program
    .command('grammar-to-json')
    .description('Parse .grammar source and produce .json')
    .option('-r, --registry <file>', 'Registry file for resolving fully qualified names')
    .option('-n, --name <name>', 'Fully qualified name of the grammar')
    .action(async (options) => {
        try {
            if (!options.registry) {
                throw new Error('Registry file is required');
            }
            if (!options.name) {
                throw new Error('Fully qualified name is required');
            }

            const registry = new Registry(options.registry);
            const input = registry.readInput(options.name, 'ldw.grammar');

            const output = JSON.stringify(
                composePasses(new ParsedGrammarFromSource(), new ExtendedGrammarFromParsedGrammar()).transform(input),
                null,
                2
            );

            await registry.writeOutput(options.name, output, 'ldw.grammar.json');
        } catch (error) {
            handleError(error);
        }
    });

program
    .command('grammar-to-model')
    .description('Parse .grammar source and produce .model source')
    .option('-r, --registry <file>', 'Registry file for resolving fully qualified names')
    .option('-n, --name <name>', 'Fully qualified name of the grammar')
    .action(async (options) => {
        try {
            if (!options.registry) {
                throw new Error('Registry file is required');
            }
            if (!options.name) {
                throw new Error('Fully qualified name is required');
            }

            const registry = new Registry(options.registry);
            const input = registry.readInput(options.name, 'ldw.grammar');

            const output = composePasses(
                new ParsedGrammarFromSource(),
                new ExtendedGrammarFromParsedGrammar(),
                new TypedGrammarFromExtendedGrammar(),
                // new RemoveAnonymousTypes(),
                new ParsedModelFromTypedGrammar(),
                new ParsedModelToSource()
            ).transform(input);

            await registry.writeOutput(options.name, output, 'ldw.model');
        } catch (error) {
            handleError(error);
        }
    });

program
    .command('grammar-to-parser')
    .description('Parse .grammar source and produce a parser module')
    .option('-r, --registry <file>', 'Registry file for resolving fully qualified names')
    .option('-n, --name <name>', 'Fully qualified name of the grammar')
    .action(async (options) => {
        try {
            if (!options.registry) {
                throw new Error('Registry file is required');
            }
            if (!options.name) {
                throw new Error('Fully qualified name is required');
            }

            const registry = new Registry(options.registry);
            const input = registry.readInput(options.name, 'ldw.grammar');

            const output = composePasses(
                new ParsedGrammarFromSource(),
                new ExtendedGrammarFromParsedGrammar(),
                new TypedGrammarFromExtendedGrammar(),
                // new RemoveAnonymousTypes(),
                new GrammarWithTypesToParserTypescriptSource()
            ).transform(input);

            await registry.writeOutput(options.name, output, 'parser.ts');
        } catch (error) {
            handleError(error);
        }
    });

program
    .command('model-to-json')
    .description('Parse .model source and produce .json')
    .option('-r, --registry <file>', 'Registry file for resolving fully qualified names')
    .option('-n, --name <name>', 'Fully qualified name of the model')
    .action(async (options) => {
        try {
            if (!options.registry) {
                throw new Error('Registry file is required');
            }
            if (!options.name) {
                throw new Error('Fully qualified name is required');
            }

            const registry = new Registry(options.registry);
            const modelSource = registry.readInput(options.name, 'ldw.model');

            const parser = new ParsedModelFromSource();
            const model = parser.transform(modelSource);
            const output = JSON.stringify(model, null, 2);

            await registry.writeOutput(options.name, output, 'ldw.model.json');
        } catch (error) {
            handleError(error);
        }
    });

program
    .command('model-to-types')
    .description('Parse .model source and produce a type module')
    .option('-r, --registry <file>', 'Registry file for resolving fully qualified names')
    .option('-n, --name <name>', 'Fully qualified name of the model')
    .option('-g, --generics', 'Use generics for typescript', false)
    .option('-l, --language <lang>', 'Output language (typescript or rust)', 'typescript')
    .action(async (options) => {
        try {
            if (!options.registry) {
                throw new Error('Registry file is required');
            }
            if (!options.name) {
                throw new Error('Fully qualified name is required');
            }

            const registry = new Registry(options.registry);
            const input = registry.readInput(options.name, 'ldw.model');

            const isTypescript = options.language === 'typescript';

            const output = composePasses(
                new ParsedModelFromSource(),
                isTypescript
                    ? new ParsedModelToTypesTypescriptSource(options.generics)
                    : new ParsedModelToTypesRustSource()
            ).transform(input);

            const outputName = isTypescript ? 'model.ts' : 'model.rs';
            await registry.writeOutput(options.name, output, outputName);
        } catch (error) {
            handleError(error);
        }
    });

program
    .command('model-to-transformer')
    .description('Parse .model source and produce a transformer module')
    .option('-r, --registry <file>', 'Registry file for resolving fully qualified names')
    .option('-n, --name <name>', 'Fully qualified name of the model')
    .option('-l, --language <lang>', 'Output language (typescript or rust)', 'typescript')
    .action(async (options) => {
        try {
            if (!options.registry) {
                throw new Error('Registry file is required');
            }
            if (!options.name) {
                throw new Error('Fully qualified name is required');
            }

            const registry = new Registry(options.registry);
            const input = registry.readInput(options.name, 'ldw.model');

            const isTypescript = options.language === 'typescript';

            const output = composePasses(
                new ParsedModelFromSource(),
                isTypescript ? new ParsedModelToTransformerTypescriptSource() : new ParsedModelToTransformerRustSource()
            ).transform(input);

            const outputName = isTypescript ? 'transformer.ts' : 'transformer.rs';
            await registry.writeOutput(options.name, output, outputName);
        } catch (error) {
            handleError(error);
        }
    });

program
    .command('model-to-visitor')
    .description('Parse .model source and produce a visitor module')
    .option('-r, --registry <file>', 'Registry file for resolving fully qualified names')
    .option('-n, --name <name>', 'Fully qualified name of the model')
    .option('-l, --language <lang>', 'Output language (typescript or rust)', 'typescript')
    .action(async (options) => {
        try {
            if (!options.registry) {
                throw new Error('Registry file is required');
            }
            if (!options.name) {
                throw new Error('Fully qualified name is required');
            }

            const registry = new Registry(options.registry);
            const input = registry.readInput(options.name, '.model');

            const isTypescript = options.language === 'typescript';

            const output = composePasses(
                new ParsedModelFromSource(),
                isTypescript ? new ParsedModelToVisitorTypescriptSource() : new ParsedModelToVisitorRustSource()
            ).transform(input);

            const outputName = isTypescript ? 'visitor.ts' : 'visitor.rs';
            await registry.writeOutput(options.name, output, outputName);
        } catch (error) {
            handleError(error);
        }
    });

program.parse(process.argv);
