# Language Design Workbench (LDW)

The LDW is a tool for working with language grammars, and generating the tooling
and documentation for them.

A grammar in LDW is defined in a file with the extension `.msbnf`. The grammar
is a set of rules that define the structure of a language. This file uses a
specific syntax, which is itself defined in a grammar, specified in the
`msbnf.msbnf` file.

The comments in `.msbnf` files provide additional notes for the grammar.

The system is intended to support modular grammar design and language embedding,
so a grammar can reference rules from other grammars.

It is intended that LDW generate a number of Typescript modules from each grammar:

- `<grammar name>.ts`: This module defines the abstract model of the language.
- `<grammar name>-parser.ts`: This modules defines a parser for the language.
- `<grammar name>-prettier-plugin.ts`: This module defines a prettier plugin for the language.
- `<grammar name>-instance-generator.ts`: This modules creates a random
  instance of the abstract model for the purposes of testing.
- `<grammar name>-cli.ts`: This module defines a CLI interface to the tools.

It is also intended that LDW generate:

- a VSCode extension that provides syntax highlighting and other features for the language.
- an LSP server that provides language features for the language.
- an SPA that provides a web-based IDE for the language, including a playground
  for testing the language, navigating the CST and AST, running queries against
  those trees, executing tree transformations, and generating code snippets from
  all of these operations, in a variety of programming languages.

## Bootstrapping

One challenge with a system like this, that includes a language that is used to
define languages, is the specification of that initial meta-language. This is
done in the file `msbnf.msbnf`. That file has comments that give extra detail
and explanation about the structure and meaning of the grammar.

When it comes to generating the code for the meta-language, we needed to be able
to bootstrap the system. This was done by using AI to create a model of the
language from the grammar, and also to create an initial parser that could parse
the grammar and create a model instance. We did need to do some post-processing
work on that initial AI generated model and parser, to make them more usable,
and also so that they could be used as example inputs to the AI process. Now
that we have a useable model and working parser, we can use that parser to parse
the meta-language grammar and start to build the rest of the tooling by
generating code from the model.

The important artefacts of the bootstrapping process are:

- The `grammars/msbnf.msbnf` file (meta-)defines the (meta-)language.
- The `src/msbnf.ts` file defines the abstract model of the msbnf language.
- The `src/msbnf-parser.ts` file parses `.msbnf` files and produces an instance of the abstract model.

This process also resulted in the design and implementation of a parser library:

- The `src/inputStream.ts` file defines a core interface for input stream handling.
- The `src/stringInputStream.ts` file implements the `InputStream` interface for string-based input.
- The `src/parser.ts` file defines the core parsing infrastructure, including trivia skipping and recording, and error reporting.
- The `src/parseError.ts` file defines a custom error class for parsing errors.

Finally, we also created a CLI interface for the tools:

- The `src/msbnf-cli.ts` file that defines a CLI interface for the tools.
