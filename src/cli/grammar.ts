#!/usr/bin/env node

import { program } from 'commander';
import * as fs from 'fs';
import { GrammarToModel } from '../languages/grammar/passes/grammar_to_model';
import { StringToGrammar } from '../languages/grammar/passes/string_to_grammar';
import { AssignNameToAnonymousFields as AssignNamesToAnonymousFields } from '../languages/model/passes/assign-names-to-anonymous-fields';
import { DenestWrappers } from '../languages/model/passes/denest-wrappers';
import { FlattenNestedProductTypes } from '../languages/model/passes/flatten-nested-product-types';
import { InlineNamedTypeWrappers } from '../languages/model/passes/inline-named-type-wrappers';
import { MergeEquivalentProductTypeFields } from '../languages/model/passes/merge-equivalent-product-type-fields';
import { ModelToRustString } from '../languages/model/passes/model_to_rust-string';
import { ModelToTypescriptString } from '../languages/model/passes/model_to_typescript-string';
import { PluralizeArrayFields } from '../languages/model/passes/pluralize-array-fields';
import { UnwrapPrimitiveWrappers } from '../languages/model/passes/unwrap-primitive-wrappers';
import { composePasses, optionalPass } from '../nanopass/util';
import { ParseError } from '../parser/parseError';
import { MergeIdenticalSumTypeMembers } from '../languages/model/passes/merge-identical-sum-type-members';
import { FullyResolveTypeAliases } from '../languages/model/passes/fully-resolve-type-aliases';
import { RemoveUnreferencedTypes } from '../languages/model/passes/remove-unreferenced-types';

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
    .command('modelgen')
    .description('Parse an MSBNF grammar and generate the model types')
    .option('-i, --input <file>', 'Input file (default: stdin)')
    .option('-o, --output <file>', 'Output file (default: stdout)')
    .option('-g, --generics', 'Use generics for typescript', false)
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

            // We're not using the 'roots' variable in the transformation process
            // as per the feedback, but it's available here if needed in the future

            const output = composePasses(
                new StringToGrammar(),
                new GrammarToModel(),
                new MergeIdenticalSumTypeMembers(),
                // for typescript we only need to flatten anonymous fields in product types
                // whereas for rust we need to flatten all product types
                new FlattenNestedProductTypes(isTypescript),
                new AssignNamesToAnonymousFields(),
                new InlineNamedTypeWrappers(),
                new DenestWrappers(),
                new UnwrapPrimitiveWrappers(),
                new MergeEquivalentProductTypeFields(),
                new FullyResolveTypeAliases(),
                optionalPass(
                    roots !== undefined,
                    new RemoveUnreferencedTypes(roots)
                ),
                new PluralizeArrayFields(),
                isTypescript
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
