# Language Design Workbench (LDW)

## Overview

The Language Design Workbench (LDW) is a tool for working with language
grammars and generating tooling and documentation for them. It allows you to
define grammars using a specific syntax and generates various TypeScript modules
to support language processing, parsing, formatting, and testing.

There is further documentation in the [docs/Overview.md](docs/Overview.md) file,
which describes the system in more detail, and in particular is used as an input
to AI prompts.

This project is largely generated by AI, and forms a testbed for using AI for
coding, especially in the field of programming language design and
implementation.

## [ Installation ](./Installation.md)

## Usage

### Using the LDW CLI

The Language Design Workbench CLI is built with TypeScript and runs directly using ts-node, which allows for a smoother development experience and more accurate error messages.

To use the Language Design Workbench CLI, run:

```
npm run ldw
```

For more information about available commands and options, run:

```
npm run ldw -- --help
```

Note: There's no need for a separate build step as the project uses ts-node to run TypeScript files directly.

## Testing

For information on how to perform iterative testing and debugging of the LDWM source generation and parsing process, please refer to the [Testing and Debugging Guide](Testing.md).

## Tutorial

A [tutorial](docs/tutorial/parser/README.md) on building parsers using the custom parser
infrastructure is available. Please note that this tutorial was created by AI
using the simplest possible instruction and has not been touched by a human. It
is known to be very much a first pass that is neither focused on what we want,
nor guaranteed to be correct. Use it as a starting point for understanding the
system, but be aware that it may contain inaccuracies or may not fully align
with the project's current state or goals.
