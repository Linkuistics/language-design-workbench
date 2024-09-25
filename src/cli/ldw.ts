#!/usr/bin/env node

import { program } from 'commander';
import * as fs from 'fs';
import { GrammarToModel } from '../languages/ldwg/passes/to_model';
import { StringToGrammar } from '../languages/ldwg/passes/from_ldwg_source';
import { AssignNameToAnonymousFields as AssignNamesToAnonymousFields } from '../languages/ldwm/passes/assign-names-to-anonymous-fields';
import { DenestWrappers } from '../languages/ldwm/passes/denest-wrappers';
import { FlattenNestedProductTypes } from '../languages/ldwm/passes/flatten-nested-product-types';
import { InlineNamedTypeWrappers } from '../languages/ldwm/passes/inline-named-type-wrappers';
import { MergeEquivalentProductTypeFields } from '../languages/ldwm/passes/merge-equivalent-product-type-fields';
import { ModelToRustString } from '../languages/ldwm/passes/to_rust_source';
import { ModelToTypescriptString } from '../languages/ldwm/passes/to_typescript_source';
import { PluralizeArrayFields } from '../languages/ldwm/passes/pluralize-array-fields';
import { UnwrapPrimitiveWrappers } from '../languages/ldwm/passes/unwrap-primitive-wrappers';
import { composePasses, optionalPass } from '../nanopass/util';
import { ParseError } from '../parser/parseError';
import { MergeIdenticalSumTypeMembers } from '../languages/ldwm/passes/merge-identical-sum-type-members';
import { FullyResolveTypeAliases } from '../languages/ldwm/passes/fully-resolve-type-aliases';
import { RemoveUnreferencedTypes } from '../languages/ldwm/passes/remove-unreferenced-types';
import { InlineDiscriminatedTypeWrappers } from '../languages/ldwm/passes/inline-discriminated-type-wrappers';
import { InlineUndiscriminatedTypeWrappers } from '../languages/ldwm/passes/inline-undiscriminated-type-wrappers';
import { ModelToModelString } from '../languages/ldwm/passes/to_ldwm_source';
import { GrammarToParser } from '../languages/ldwg/passes/to_parser_source';
import { AllocateLabels } from '../languages/ldwg/passes/allocate_labels';

program.version('1.0.0').description('MSBNF Grammar CLI');

program
    .command('parse')
    .description('Parse an MSBNF grammar')
    .option('-i, --input <file>', 'Input file (default: stdin)')
    .option('-o, --output <file>', 'Output file (default: stdout)')
    .action(async (options) => {
        try {
            const input = options.input
                ? fs.readFileSync(options.input, 'utf-8')
                : await readStdin();

            const stringToGrammar = new StringToGrammar();
            const grammar = stringToGrammar.transform(input);
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
    .command('ldwg-to-ldwm')
    .description('Produce a model definition language from a grammar')
    .option('-i, --input <file>', 'Input file (default: stdin)')
    .option('-o, --output <file>', 'Output file (default: stdout)')
    .action(async (options) => {
        try {
            const input = options.input
                ? fs.readFileSync(options.input, 'utf-8')
                : await readStdin();

            const output = composePasses(
                new StringToGrammar(),
                new AllocateLabels(),
                new GrammarToModel(),
                new ModelToModelString()
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
    .description('Produce a model definition language from a grammar')
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
                new StringToGrammar(),
                new GrammarToParser()
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
    .command('modelgen')
    .description('Parse an ldwg file and generate code')
    .option('-i, --input <file>', 'Input file (default: stdin)')
    .option('-o, --output <file>', 'Output file (default: stdout)')
    .option('-g, --generics', 'Use generics for typescript', false)
    .option(
        '-l, --language <lang>',
        'Output language (model or typescript or rust)',
        'model'
    )
    .option('-r, --roots <roots>', 'Comma-separated list of root types')
    .action(async (options) => {
        try {
            const input = options.input
                ? fs.readFileSync(options.input, 'utf-8')
                : await readStdin();

            const isModel = options.language === 'model';
            const isTypescript = options.language === 'typescript';
            const roots = options.roots ? options.roots.split(',') : undefined;

            const output = composePasses(
                new StringToGrammar(),
                new GrammarToModel(),
                // new MergeIdenticalSumTypeMembers(),
                // for typescript we only need to flatten anonymous fields in product types
                // whereas for rust we need to flatten all product types

                // new FlattenNestedProductTypes(isTypescript),
                // new AssignNamesToAnonymousFields(),
                // new InlineDiscriminatedTypeWrappers(),
                // new InlineUndiscriminatedTypeWrappers(),

                // new InlineNamedTypeWrappers(),
                // new DenestWrappers(),

                // new UnwrapPrimitiveWrappers(),
                // new MergeEquivalentProductTypeFields(),
                // new FullyResolveTypeAliases(),
                // optionalPass(
                //     roots !== undefined,
                //     new RemoveUnreferencedTypes(roots)
                // ),
                // new PluralizeArrayFields(),

                isModel
                    ? new ModelToModelString()
                    : isTypescript
                      ? new ModelToTypescriptString(options.generics)
                      : new ModelToRustString()
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
