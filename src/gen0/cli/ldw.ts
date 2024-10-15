import { program } from 'commander';
import { ExtendedGrammarFromParsedGrammar } from '../languages/ldw/grammar/extended/creation/fromParsedGrammar';
import { ParsedGrammarFromSource } from '../languages/ldw/grammar/parsed/creation/fromSource';
import { TypedGrammarFromExtendedGrammar } from '../languages/ldw/grammar/typed/creation/fromExtendedGrammar';
import { DiscriminatedModelFromResolvedModel } from '../languages/ldw/model/discriminated/creation/fromResolvedModel';
import { ParsedModelToTypesTypescriptSource } from '../languages/ldw/model/discriminated/outputs/toTypesTypescriptSource';
import { ParsedModelToVisitorTypescriptSource } from '../languages/ldw/model/discriminated/outputs/toVisitorTypescriptSource';
import { ParsedModelFromSource } from '../languages/ldw/model/parsed/creation/fromSource';
import { ParsedModelFromTypedGrammar } from '../languages/ldw/model/parsed/creation/fromTypedGrammar';
import { Model as ParsedModel } from '../languages/ldw/model/parsed/model';
import { ParsedModelToSource } from '../languages/ldw/model/parsed/outputs/toSource';
import { ResolvedModelFromParsedModel } from '../languages/ldw/model/resolved/creation/fromParsedModel';
import { composePasses } from '../nanopass/combinators';
import { Registry } from '../nanopass/registry';
import { ParseError } from '../parsing/parseError';

program.version('1.0.0').description('Language Design Workbench CLI');

function handleError(error: unknown): never {
    if (error instanceof ParseError) {
        console.error(`Parse Error: ${error.toString()}`);
    } else {
        console.error(error);
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

            const grammarSource = registry.readInput(options.name, 'ldw.grammar');

            const modelSource = composePasses(
                new ParsedGrammarFromSource(),
                new ExtendedGrammarFromParsedGrammar(),
                new TypedGrammarFromExtendedGrammar(),
                new ParsedModelFromTypedGrammar(),
                new ParsedModelToSource()
            ).transform(grammarSource);
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
            const modelSource = registry.readInput(options.name, 'ldw.model');

            const passes = composePasses(
                new ParsedModelFromSource(),
                new ResolvedModelFromParsedModel((fqn: string): ParsedModel => {
                    const modelSource = registry.readInput(fqn, 'ldw.model');
                    return new ParsedModelFromSource().transform(modelSource);
                }),
                new DiscriminatedModelFromResolvedModel()
            );
            const discriminatedModel = passes.transform(modelSource);

            if (isTypescript) {
                const typesSource = new ParsedModelToTypesTypescriptSource(registry, options.generics).transform(
                    discriminatedModel
                );
                await registry.writeOutput(options.name, typesSource, 'model.ts');

                const visitorSource = new ParsedModelToVisitorTypescriptSource().transform(discriminatedModel);
                await registry.writeOutput(options.name, visitorSource, 'visitor.ts');
            }
        } catch (error) {
            handleError(error);
        }
    });

program.parse(process.argv);
