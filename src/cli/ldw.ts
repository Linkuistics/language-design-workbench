import { program } from 'commander';
import * as fs from 'fs';
import { FromGrammarSource } from '../models/grammar/passes/fromGrammarSource';
import { ToGrammarWithTypes } from '../models/grammar/passes/toGrammarWithTypes';
import { ToParserTypescriptSource } from '../models/grammarWithTypes/passes/toParserTypescriptSource';
import { ToModel } from '../models/grammarWithTypes/passes/toModel';
import { FromModelSource } from '../models/model/passes/from_model-source';
import { ToModelSource } from '../models/model/passes/to_model-source';
import { ToModelTypescriptSource } from '../models/model/passes/to_model-typescript-source';
import { composePasses } from '../nanopass/combinators';
import { ParseError } from '../parser/parseError';

program.version('1.0.0').description('Language Design Workbench CLI');

program
    .command('grammar-to-json')
    .description('Parse .grammar source and produce JSON')
    .option('-i, --input <file>', 'Input file (default: stdin)')
    .option('-o, --output <file>', 'Output file (default: stdout)')
    .action(async (options) => {
        try {
            const input = options.input
                ? fs.readFileSync(options.input, 'utf-8')
                : await readStdin();

            const parser = new FromGrammarSource();
            const grammar = parser.transform(input);
            const output = JSON.stringify(grammar, null, 2);

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
            const input = options.input
                ? fs.readFileSync(options.input, 'utf-8')
                : await readStdin();

            const output = composePasses(
                new FromGrammarSource(),
                new ToGrammarWithTypes(),
                new ToModel(),
                new ToModelSource()
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
            const input = options.input
                ? fs.readFileSync(options.input, 'utf-8')
                : await readStdin();

            const output = composePasses(
                new FromGrammarSource(),
                new ToGrammarWithTypes(),
                new ToParserTypescriptSource()
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
            const input = options.input
                ? fs.readFileSync(options.input, 'utf-8')
                : await readStdin();

            const parser = new FromModelSource();
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
            const input = options.input
                ? fs.readFileSync(options.input, 'utf-8')
                : await readStdin();

            // const isTypescript = options.language === 'typescript';
            // const roots = options.roots ? options.roots.split(',') : undefined;

            const output = composePasses(
                new FromModelSource(),
                new ToModelTypescriptSource(options.generics)
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
