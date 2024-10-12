import Ajv from 'ajv';
import { exec } from 'child_process';
import { program } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { ExtendedGrammarFromParsedGrammar } from '../languages/ldw/grammar/extended/creation/fromParsedGrammar';
import { ParsedGrammarFromSource } from '../languages/ldw/grammar/parsed/creation/fromSource';
import { TypedGrammarFromExtendedGrammar } from '../languages/ldw/grammar/typed/creation/fromExtendedGrammar';
import { ParsedModelFromSource } from '../languages/ldw/model/parsed/creation/fromSource';
import { ParsedModelFromTypedGrammar } from '../languages/ldw/model/parsed/creation/fromTypedGrammar';
import { ParsedModelToSource } from '../languages/ldw/model/parsed/outputs/toSource';
import { composePasses } from '../nanopass/combinators';
import { ParseError } from '../parsing/parseError';
import { ParsedModelToVisitorTypescriptSource } from '../languages/ldw/model/resolved/outputs/toVisitorTypescriptSource';
import { ParsedModelToTypesTypescriptSource } from '../languages/ldw/model/resolved/outputs/toTypesTypescriptSource';
import { ResolvedModelFromParsedModel } from '../languages/ldw/model/resolved/creation/fromParsedModel';

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
        // console.log(`Output: ${outputPath}`);
        await this.formatOutput(outputPath);
    }

    private async formatOutput(filePath: string): Promise<void> {
        const ext = path.extname(filePath);
        if (ext === '.ts' || ext === '.js' || ext === '.json') {
            await execPromise(`npx prettier --write "${filePath}"`);
            // console.log(`Prettier: ${filePath}`);
        } else if (ext === '.rs') {
            await execPromise(`rustfmt "${filePath}"`);
            // console.log(`Rustfmt: ${filePath}`);
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
    .command('process-grammar')
    .description('Parse .grammar source and generate artefacts')
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

            const typedGrammar = composePasses(
                new ParsedGrammarFromSource(),
                new ExtendedGrammarFromParsedGrammar(),
                new TypedGrammarFromExtendedGrammar()
            ).transform(input);

            const modelSource = composePasses(new ParsedModelFromTypedGrammar(), new ParsedModelToSource()).transform(
                typedGrammar
            );
            await registry.writeOutput(options.name, modelSource, 'ldw.model');
        } catch (error) {
            handleError(error);
        }
    });

program
    .command('process-model')
    .description('Parse .model source and generate artefacts')
    .option('-r, --registry <file>', 'Registry file for resolving fully qualified names')
    .option('-n, --name <name>', 'Fully qualified name of the grammar')
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

            const isTypescript = options.language === 'typescript';
            const input = registry.readInput(options.name, 'ldw.model');

            const parsedModel = composePasses(
                new ParsedModelFromSource(),
                new ResolvedModelFromParsedModel()
            ).transform(input);

            if (isTypescript) {
                const typesSource = new ParsedModelToTypesTypescriptSource(options.generics).transform(parsedModel);
                await registry.writeOutput(options.name, typesSource, 'model.ts');
                const visitorSource = new ParsedModelToVisitorTypescriptSource().transform(parsedModel);
                await registry.writeOutput(options.name, visitorSource, 'visitor.ts');
            }
        } catch (error) {
            handleError(error);
        }
    });

program.parse(process.argv);
