import { Command, program } from 'commander';
import { ExtendedGrammarFromParsedGrammar } from '../languages/ldw/grammar/extended/creation/fromParsedGrammar';
import { ParsedGrammarFromSource } from '../languages/ldw/grammar/parsed/creation/fromSource';
import { TypedGrammarFromExtendedGrammar } from '../languages/ldw/grammar/typed/creation/fromExtendedGrammar';
import { TypedGrammarToTypescriptParserSource } from '../languages/ldw/grammar/typed/outputs/toTypescriptParserSource';
import { DiscriminatedModelFromResolvedModel } from '../languages/ldw/model/discriminated/creation/fromResolvedModel';
import { DiscriminatedModelToTypescriptBuilderSource } from '../languages/ldw/model/discriminated/outputs/toTypescriptBuilderSource';
import { DiscriminatedModelToTypescriptModelSource } from '../languages/ldw/model/discriminated/outputs/toTypescriptModelSource';
import { DiscriminatedModelToTypescriptVisitorSource } from '../languages/ldw/model/discriminated/outputs/toTypescriptVisitorSource';
import { ParsedModelFromSource } from '../languages/ldw/model/parsed/creation/fromSource';
import { ParsedModelFromTypedGrammar } from '../languages/ldw/model/parsed/creation/fromTypedGrammar';
import { Model as ParsedModel } from '../languages/ldw/model/parsed/model';
import { ParsedModelToSource } from '../languages/ldw/model/parsed/outputs/toSource';
import { ResolvedModelFromParsedModel } from '../languages/ldw/model/resolved/creation/fromParsedModel';
import { composePasses } from '../nanopass/combinators';
import { Registry } from '../nanopass/registry';
import { ParseError } from '../parsing/parseError';

program.version('1.0.0').description('Language Design Workbench CLI');

class ArgumentValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ArgumentValidationError';
    }
}

function handleError(error: unknown, command: Command): never {
    if (error instanceof ArgumentValidationError) {
        process.stderr.write(`Error: ${error.message}\n`);
        command.help({ error: true });
    } else if (error instanceof ParseError) {
        process.stderr.write(`Parse Error: ${error.toString()}\n`);
    } else {
        process.stderr.write(`${error}\n`);
    }
    process.exit(1);
}

program
    .command('process-grammar')
    .description('Parse .grammar source and generate artefacts')
    .option('-r, --registry <file>', 'Registry file for resolving fully qualified names')
    .option('-n, --name <name>', 'Fully qualified name of the grammar')
    .option('-l, --language <lang>', 'Output language (typescript or rust)', 'typescript')
    .option(
        '--roots <roots>',
        'Comma-separated list of root rule names',
        (value: string, previous: string[]) => {
            const newRoots = value.split(',');
            return previous ? previous.concat(newRoots) : newRoots;
        },
        [] as string[]
    )
    .action(async (options, command) => {
        try {
            if (!options.registry) {
                throw new ArgumentValidationError('Registry file is required');
            }
            if (!options.name) {
                throw new ArgumentValidationError('Fully qualified name is required');
            }

            const registry = new Registry(options.registry);

            const isTypescript = options.language === 'typescript';

            const dslSource = registry.readInput(options.name, 'ldw.grammar');

            const typedGrammar = composePasses(
                new ParsedGrammarFromSource(),
                new ExtendedGrammarFromParsedGrammar(),
                new TypedGrammarFromExtendedGrammar()
            ).transform(dslSource);

            if (isTypescript) {
                const modelSource = composePasses(
                    new ParsedModelFromTypedGrammar(),
                    new ParsedModelToSource()
                ).transform(typedGrammar);
                await registry.writeOutput(options.name, modelSource, 'ldw.model');

                const parserSource = new TypedGrammarToTypescriptParserSource(options.roots).transform(typedGrammar);
                await registry.writeOutput(options.name, parserSource, 'parser.ts');
            }
        } catch (error) {
            handleError(error, command);
        }
    });

program
    .command('process-model')
    .description('Parse .model source and generate artefacts')
    .option('-r, --registry <file>', 'Registry file for resolving fully qualified names')
    .option('-n, --name <name>', 'Fully qualified name of the grammar')
    .option('-l, --language <lang>', 'Output language (typescript or rust)', 'typescript')
    .action(async (options, command) => {
        try {
            if (!options.registry) {
                throw new ArgumentValidationError('Registry file is required');
            }
            if (!options.name) {
                throw new ArgumentValidationError('Fully qualified name is required');
            }

            const registry = new Registry(options.registry);

            const isTypescript = options.language === 'typescript';

            const dslSource = registry.readInput(options.name, 'ldw.model');

            const discriminatedModel = composePasses(
                new ParsedModelFromSource(),
                new ResolvedModelFromParsedModel((fqn: string): ParsedModel => {
                    const modelSource = registry.readInput(fqn, 'ldw.model');
                    return new ParsedModelFromSource().transform(modelSource);
                }),
                new DiscriminatedModelFromResolvedModel()
            ).transform(dslSource);

            if (isTypescript) {
                const modelSource = new DiscriminatedModelToTypescriptModelSource(registry).transform(
                    discriminatedModel
                );
                await registry.writeOutput(options.name, modelSource, 'model.ts');

                // const transformerSource = new ParsedModelToTypescriptTransformerSource().transform(discriminatedModel);
                // await registry.writeOutput(options.name, transformerSource, 'transformer.ts');

                const builderSource = new DiscriminatedModelToTypescriptBuilderSource().transform(discriminatedModel);
                await registry.writeOutput(options.name, builderSource, 'buider.ts');

                const visitorSource = new DiscriminatedModelToTypescriptVisitorSource().transform(discriminatedModel);
                await registry.writeOutput(options.name, visitorSource, 'visitor.ts');
            }
        } catch (error) {
            handleError(error, command);
        }
    });

program.parse(process.argv);
