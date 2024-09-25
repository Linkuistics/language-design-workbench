#!/usr/bin/env node

import { program } from 'commander';
import * as fs from 'fs';
import { ToLDWM } from '../languages/ldwg/passes/to_ldwm';
import { FromLDWGSoruce as FromLDWGSource } from '../languages/ldwg/passes/from_ldwg-source';
import { AssignNameToAnonymousFields as AssignNamesToAnonymousFields } from '../languages/ldwm/passes/assign-names-to-anonymous-fields';
import { DenestWrappers } from '../languages/ldwm/passes/denest-wrappers';
import { FlattenNestedProductTypes } from '../languages/ldwm/passes/flatten-nested-product-types';
import { InlineNamedTypeWrappers } from '../languages/ldwm/passes/inline-named-type-wrappers';
import { MergeEquivalentProductTypeFields } from '../languages/ldwm/passes/merge-equivalent-product-type-fields';
import { ToModelRustSource } from '../languages/ldwm/passes/to_model-rust-source';
import { ToModelTypescriptSource } from '../languages/ldwm/passes/to_model-typescript-source';
import { PluralizeArrayFields } from '../languages/ldwm/passes/pluralize-array-fields';
import { UnwrapPrimitiveWrappers } from '../languages/ldwm/passes/unwrap-primitive-wrappers';
import { composePasses, optionalPass } from '../nanopass/util';
import { ParseError } from '../parser/parseError';
import { MergeIdenticalSumTypeMembers } from '../languages/ldwm/passes/merge-identical-sum-type-members';
import { FullyResolveTypeAliases } from '../languages/ldwm/passes/fully-resolve-type-aliases';
import { RemoveUnreferencedTypes } from '../languages/ldwm/passes/remove-unreferenced-types';
import { InlineDiscriminatedTypeWrappers } from '../languages/ldwm/passes/inline-discriminated-type-wrappers';
import { InlineUndiscriminatedTypeWrappers } from '../languages/ldwm/passes/inline-undiscriminated-type-wrappers';
import { ToLDWMSource } from '../languages/ldwm/passes/to_ldwm-source';
import { ToParserTypescriptSource } from '../languages/ldwg/passes/to_parser-typescript-source';
import { AllocateLabels } from '../languages/ldwg/passes/allocate-labels';
import { FromLDWMSource } from '../languages/ldwm/passes/from_ldwm-source';

program.version('1.0.0').description('MSBNF Grammar CLI');

program
    .command('ldwg-parse')
    .description('Parse .ldwg source to JSON')
    .option('-i, --input <file>', 'Input file (default: stdin)')
    .option('-o, --output <file>', 'Output file (default: stdout)')
    .action(async (options) => {
        try {
            const input = options.input
                ? fs.readFileSync(options.input, 'utf-8')
                : await readStdin();

            const parser = new FromLDWGSource();
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
    .command('ldwm-parse')
    .description('Parse .ldwm source to JSON')
    .option('-i, --input <file>', 'Input file (default: stdin)')
    .option('-o, --output <file>', 'Output file (default: stdout)')
    .action(async (options) => {
        try {
            const input = options.input
                ? fs.readFileSync(options.input, 'utf-8')
                : await readStdin();

            const parser = new FromLDWMSource();
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
    .command('ldwg-to-ldwm')
    .description('Produce .ldwm source from .ldwg source')
    .option('-i, --input <file>', 'Input file (default: stdin)')
    .option('-o, --output <file>', 'Output file (default: stdout)')
    .action(async (options) => {
        try {
            const input = options.input
                ? fs.readFileSync(options.input, 'utf-8')
                : await readStdin();

            const output = composePasses(
                new FromLDWGSource(),
                new AllocateLabels(),
                new ToLDWM(),
                new ToLDWMSource()
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
    .command('ldwg-to-parser')
    .description('Produce a parser from .ldwg source')
    .option('-i, --input <file>', 'Input file (default: stdin)')
    .option('-o, --output <file>', 'Output file (default: stdout)')
    .option(
        '-l, --language <lang>',
        'Output language (typescript or rust)',
        'typescript'
    )
    .option('-r, --roots <roots>', 'Comma-separated list of root types')
    .action(async (options) => {
        try {
            const input = options.input
                ? fs.readFileSync(options.input, 'utf-8')
                : await readStdin();

            if (
                options.language !== 'typescript' &&
                options.language !== 'rust'
            ) {
                throw new Error(
                    'Invalid language option. Use either "typescript" or "rust".'
                );
            }

            const isTypescript = options.language === 'typescript';
            const roots = options.roots ? options.roots.split(',') : undefined;

            const output = composePasses(
                new FromLDWGSource(),
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

// program
//     .command('ldwm-to-types')
//     .description('Produce type definitions from .ldwm source')
//     .option('-i, --input <file>', 'Input file (default: stdin)')
//     .option('-o, --output <file>', 'Output file (default: stdout)')
//     .option('-g, --generics', 'Use generics for typescript', false)
//     .option(
//         '-l, --language <lang>',
//         'Output language (typescript or rust)',
//         'typescript'
//     )
//     .option('-r, --roots <roots>', 'Comma-separated list of root types')
//     .action(async (options) => {
//         try {
//             const input = options.input
//                 ? fs.readFileSync(options.input, 'utf-8')
//                 : await readStdin();

//             const isTypescript = options.language === 'typescript';
//             const roots = options.roots ? options.roots.split(',') : undefined;

//             const output = composePasses(
//                 new FromLDWMSource(),
//                 // new MergeIdenticalSumTypeMembers(),
//                 // for typescript we only need to flatten anonymous fields in product types
//                 // whereas for rust we need to flatten all product types

//                 // new FlattenNestedProductTypes(isTypescript),
//                 // new AssignNamesToAnonymousFields(),
//                 // new InlineDiscriminatedTypeWrappers(),
//                 // new InlineUndiscriminatedTypeWrappers(),

//                 // new InlineNamedTypeWrappers(),
//                 // new DenestWrappers(),

//                 // new UnwrapPrimitiveWrappers(),
//                 // new MergeEquivalentProductTypeFields(),
//                 // new FullyResolveTypeAliases(),
//                 // optionalPass(
//                 //     roots !== undefined,
//                 //     new RemoveUnreferencedTypes(roots)
//                 // ),
//                 // new PluralizeArrayFields(),

//                 isTypescript
//                     ? new ToModelTypescriptSource(options.generics)
//                     : new ToModelRustSource()
//             ).transform(input);

//             if (options.output) {
//                 fs.writeFileSync(options.output, output);
//             } else {
//                 console.log(output);
//             }
//         } catch (error) {
//             if (error instanceof ParseError) {
//                 console.error(error.toString());
//             } else {
//                 console.error(error);
//             }

//             process.exit(1);
//         }
//     });

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
