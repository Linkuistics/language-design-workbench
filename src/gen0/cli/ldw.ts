import { program } from 'commander';
import * as fs from 'fs';
import { GrammarFromSource } from '../languages/ldw/grammar/parsed/creation/fromSource';
import { GrammarExtendedFromGrammar } from '../languages/ldw/grammar/extended//creation/fromGrammar';
import { GrammarWithTypesFromGrammarExtended } from '../languages/ldw/grammar/typed//creation/fromGrammarExtended';
import { GrammarWithTypesToParserTypescriptSource } from '../languages/ldw/grammar/typed//outputs/toParserTypescriptSource';
import { ModelFromGrammarWithTypes } from '../languages/ldw/model/parsed/creation/fromGrammarWithTypes';
import { ModelFromSource } from '../languages/ldw/model/parsed/creation/fromSource';
import { ModelToSource } from '../languages/ldw/model/parsed/outputs/toSource';
import { ModelToTransformerRustSource } from '../languages/ldw/model/parsed/outputs/toTransformerRustSource';
import { ModelToTransformerTypescriptSource } from '../languages/ldw/model/parsed/outputs/toTransformerTypescriptSource copy';
import { ModelToTypesRustSource } from '../languages/ldw/model/parsed/outputs/toTypesRustSource';
import { ModelToTypesTypescriptSource } from '../languages/ldw/model/parsed/outputs/toTypesTypescriptSource';
import { ModelToVisitorRustSource } from '../languages/ldw/model/parsed/outputs/toVisitorRustSource';
import { ModelToVisitorTypescriptSource } from '../languages/ldw/model/parsed/outputs/toVisitorTypescriptSource';
import { composePasses } from '../nanopass/combinators';
import { ParseError } from '../parsing/parseError';

program.version('1.0.0').description('Language Design Workbench CLI');

program
    .command('grammar-to-json')
    .description('Parse .grammar source and produce .json')
    .option('-i, --input <file>', 'Input file (default: stdin)')
    .option('-o, --output <file>', 'Output file (default: stdout)')
    .action(async (options) => {
        try {
            const input = options.input ? fs.readFileSync(options.input, 'utf-8') : await readStdin();

            const output = JSON.stringify(
                composePasses(new GrammarFromSource(), new GrammarExtendedFromGrammar()).transform(input),
                null,
                2
            );

            if (options.output) {
                fs.writeFileSync(options.output, output);
            } else {
                console.log(output);
            }
        } catch (error) {
            if (error instanceof ParseError) {
                console.error(error.toString());
            } else {
                console.error(error);
            }

            process.exit(1);
        }
    });

program
    .command('grammar-to-model')
    .description('Parse .grammar source and produce .model source')
    .option('-i, --input <file>', 'Input file (default: stdin)')
    .option('-o, --output <file>', 'Output file (default: stdout)')
    .action(async (options) => {
        try {
            const input = options.input ? fs.readFileSync(options.input, 'utf-8') : await readStdin();

            const output = composePasses(
                new GrammarFromSource(),
                new GrammarExtendedFromGrammar(),
                new GrammarWithTypesFromGrammarExtended(),
                // new RemoveAnonymousTypes(),
                new ModelFromGrammarWithTypes(),
                new ModelToSource()
            ).transform(input);

            if (options.output) {
                fs.writeFileSync(options.output, output);
            } else {
                console.log(output);
            }
        } catch (error) {
            if (error instanceof ParseError) {
                console.error(error.toString());
            } else {
                console.error(error);
            }

            process.exit(1);
        }
    });

program
    .command('grammar-to-parser')
    .description('Parse .grammar source and produce a parser module')
    .option('-i, --input <file>', 'Input file (default: stdin)')
    .option('-o, --output <file>', 'Output file (default: stdout)')
    .action(async (options) => {
        try {
            const input = options.input ? fs.readFileSync(options.input, 'utf-8') : await readStdin();

            const output = composePasses(
                new GrammarFromSource(),
                new GrammarExtendedFromGrammar(),
                new GrammarWithTypesFromGrammarExtended(),
                // new RemoveAnonymousTypes(),
                new GrammarWithTypesToParserTypescriptSource()
            ).transform(input);

            if (options.output) {
                fs.writeFileSync(options.output, output);
            } else {
                console.log(output);
            }
        } catch (error) {
            if (error instanceof ParseError) {
                console.error(error.toString());
            } else {
                console.error(error);
            }

            process.exit(1);
        }
    });

program
    .command('model-to-json')
    .description('Parse .model source and produce .json')
    .option('-i, --input <file>', 'Input file (default: stdin)')
    .option('-o, --output <file>', 'Output file (default: stdout)')
    .action(async (options) => {
        try {
            const input = options.input ? fs.readFileSync(options.input, 'utf-8') : await readStdin();

            const parser = new ModelFromSource();
            const model = parser.transform(input);
            const output = JSON.stringify(model, null, 2);

            if (options.output) {
                fs.writeFileSync(options.output, output);
            } else {
                console.log(output);
            }
        } catch (error) {
            if (error instanceof ParseError) {
                console.error(error.toString());
            } else {
                console.error(error);
            }

            process.exit(1);
        }
    });

program
    .command('model-to-types')
    .description('Parse .model source and produce a type module')
    .option('-i, --input <file>', 'Input file (default: stdin)')
    .option('-o, --output <file>', 'Output file (default: stdout)')
    .option('-g, --generics', 'Use generics for typescript', false)
    .option('-l, --language <lang>', 'Output language (typescript or rust)', 'typescript')
    .action(async (options) => {
        try {
            const input = options.input ? fs.readFileSync(options.input, 'utf-8') : await readStdin();

            const isTypescript = options.language === 'typescript';

            const output = composePasses(
                new ModelFromSource(),
                isTypescript ? new ModelToTypesTypescriptSource(options.generics) : new ModelToTypesRustSource()
            ).transform(input);

            if (options.output) {
                fs.writeFileSync(options.output, output);
            } else {
                console.log(output);
            }
        } catch (error) {
            if (error instanceof ParseError) {
                console.error(error.toString());
            } else {
                console.error(error);
            }

            process.exit(1);
        }
    });

program
    .command('model-to-transformer')
    .description('Parse .model source and produce a transformer module')
    .option('-i, --input <file>', 'Input file (default: stdin)')
    .option('-o, --output <file>', 'Output file (default: stdout)')
    .option('-l, --language <lang>', 'Output language (typescript or rust)', 'typescript')
    .action(async (options) => {
        try {
            const input = options.input ? fs.readFileSync(options.input, 'utf-8') : await readStdin();

            const isTypescript = options.language === 'typescript';

            const output = composePasses(
                new ModelFromSource(),
                isTypescript ? new ModelToTransformerTypescriptSource() : new ModelToTransformerRustSource()
            ).transform(input);

            if (options.output) {
                fs.writeFileSync(options.output, output);
            } else {
                console.log(output);
            }
        } catch (error) {
            if (error instanceof ParseError) {
                console.error(error.toString());
            } else {
                console.error(error);
            }

            process.exit(1);
        }
    });

program
    .command('model-to-visitor')
    .description('Parse .model source and produce a visitor module')
    .option('-i, --input <file>', 'Input file (default: stdin)')
    .option('-o, --output <file>', 'Output file (default: stdout)')
    .option('-l, --language <lang>', 'Output language (typescript or rust)', 'typescript')
    .action(async (options) => {
        try {
            const input = options.input ? fs.readFileSync(options.input, 'utf-8') : await readStdin();

            const isTypescript = options.language === 'typescript';

            const output = composePasses(
                new ModelFromSource(),
                isTypescript ? new ModelToVisitorTypescriptSource() : new ModelToVisitorRustSource()
            ).transform(input);

            if (options.output) {
                fs.writeFileSync(options.output, output);
            } else {
                console.log(output);
            }
        } catch (error) {
            if (error instanceof ParseError) {
                console.error(error.toString());
            } else {
                console.error(error);
            }

            process.exit(1);
        }
    });

program.parse(process.argv);

async function readStdin(): Promise<string> {
    return new Promise((resolve) => {
        let data = '';
        process.stdin.on('readable', () => {
            const chunk = process.stdin.read();
            if (chunk !== null) {
                data += chunk;
            }
        });
        process.stdin.on('end', () => {
            resolve(data);
        });
    });
}
