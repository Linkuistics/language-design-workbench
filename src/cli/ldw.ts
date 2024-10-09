import { program } from 'commander';
import * as fs from 'fs';
import { GrammarFromSource } from '../languages-meta/grammar/input/fromSource';
import { GrammarExtendedFromGrammar } from '../languages-meta/grammarExtended/input/fromGrammar';
import { GrammarWithTypesFromGrammarExtended } from '../languages-meta/grammarWithTypes/input/fromGrammarExtended';
import { GrammarWithTypesToParserTypescriptSource } from '../languages-meta/grammarWithTypes/output/toParserTypescriptSource';
import { ModelFromGrammarWithTypes } from '../languages-meta/model/input/fromGrammarWithTypes';
import { ModelFromSource } from '../languages-meta/model/input/fromSource';
import { ModelToSource } from '../languages-meta/model/output/toSource';
import { ModelToTypesTypescriptSource } from '../languages-meta/model/output/toTypesTypescriptSource';
import { composePasses } from '../nanopass/combinators';
import { ParseError } from '../input/parseError';

program.version('1.0.0').description('Language Design Workbench CLI');

program
    .command('grammar-to-json')
    .description('Parse .grammar source and produce JSON')
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
    .description('Parse .grammar source and produce a parser')
    .option('-i, --input <file>', 'Input file (default: stdin)')
    .option('-o, --output <file>', 'Output file (default: stdout)')
    .action(async (options) => {
        try {
            const input = options.input ? fs.readFileSync(options.input, 'utf-8') : await readStdin();

            const output = composePasses(
                new GrammarFromSource(),
                new GrammarExtendedFromGrammar(),
                new GrammarWithTypesFromGrammarExtended(),
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
    .description('Parse .model source and produce JSON')
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
    .description('Parse .model source and produce type definitions')
    .option('-i, --input <file>', 'Input file (default: stdin)')
    .option('-o, --output <file>', 'Output file (default: stdout)')
    .option('-g, --generics', 'Use generics for typescript', false)
    // .option(
    //     '-l, --language <lang>',
    //     'Output language (typescript or rust)',
    //     'typescript'
    // )
    // .option('-r, --roots <roots>', 'Comma-separated list of root types')
    .action(async (options) => {
        try {
            const input = options.input ? fs.readFileSync(options.input, 'utf-8') : await readStdin();

            // const isTypescript = options.language === 'typescript';
            // const roots = options.roots ? options.roots.split(',') : undefined;

            const output = composePasses(
                new ModelFromSource(),
                new ModelToTypesTypescriptSource(options.generics)
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
