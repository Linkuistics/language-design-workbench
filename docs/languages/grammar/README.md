# LDW Grammar Specification

## 1. Introduction

LDW (Language Definition Workbench) Grammar is a grammar specification language designed to provide a robust and flexible means of defining formal grammars for programming languages and other structured text formats. LDW Grammar builds upon the foundations laid by Backus-Naur Form (BNF) and its extended variant (EBNF), introducing additional features to address common challenges in language design and parsing.

### 1.1. Purpose of LDW Grammar

The primary purpose of LDW Grammar is to offer language designers and parser implementers a powerful tool that combines the simplicity of BNF with advanced features for handling complex language constructs. LDW Grammar aims to streamline the process of grammar definition while providing mechanisms to deal with operator precedence, identifier parsing, and language versioning.

### 1.2. Relationship to BNF and EBNF

LDW Grammar can be seen as an evolution of BNF and EBNF. It retains the basic structure of production rules used in these earlier forms while extending their capabilities. Users familiar with BNF or EBNF will find many concepts in LDW Grammar familiar, but with added expressiveness and flexibility.

### 1.3. Key Features

LDW Grammar introduces several key features that set it apart from its predecessors:

1. Pratt Parsing: Built-in support for Pratt parsing (top-down operator precedence parsing), allowing for concise and intuitive definitions of operator precedence and associativity.
2. Trivia Handling: A mechanism for defining and managing 'trivia' - elements like whitespace and comments that are typically ignored by the parser but are essential for formatting and documentation.
3. Special Rules: Dedicated rules for handling identifiers, trivia, and reserved keywords.
4. Versioning: A versioning system that allows grammar definitions to evolve over time while maintaining backward compatibility.
5. Modular Grammars: Support for references between different grammars, enabling modular grammar design and language embedding.

## 2. LDW Grammar Syntax

This section provides a detailed description of the LDW Grammar syntax, covering basic elements and structures used in grammar definitions.

### 2.1. Grammar Structure

An LDW Grammar consists of a set of rules enclosed within a grammar declaration.

```ldw
grammar <name> {
  // rules go here
}
```

### 2.2. Rule Types

LDW Grammar supports two main types of rules:

1. Regular rules
2. Pratt rules

#### 2.2.1. Regular Rules

```ldw
<rule_name> <rule_annotation>? <version_annotation>* = <rule_body> ;
```

Example:

```ldw
expression = term (operator term)* ;
```

#### 2.2.2. Pratt Rules

```ldw
pratt <rule_name> <version_annotation>* {
  <operator_type> <name> <version_annotation>* = <rule_body> ;
  // ... more operators ...
  primary <name> = <rule_body> ;
}
```

Example:

```ldw
pratt expression {
  left '+' = '+' ;
  left '*' = '*' ;
  prefix '-' = '-' ;
  primary term = number | '(' expression ')' ;
}
```

### 2.3. Special Rules

LDW Grammar defines several special rules that serve specific purposes in the language definition:

1. `trivia`: This rule should be a list of alternatives of all the trivia rules (e.g., whitespace, comments).
2. `identifier`: This rule should match any identifier and is also used to avoid conflicts with keywords.
3. `reserved_identifier`: This rule should list identifiers that are or were reserved for use by the language.

Example:

```ldw
trivia        @noskip = line_comment | block_comment | whitespace ;
identifier    @atomic = [a-zA-Z_] [a-zA-Z0-9_]* ;
reserved_identifier = 'if' | 'else' | 'while' | 'for' ;
```

### 2.4. Rule Body

The rule body defines the structure of the rule and can consist of one or more alternatives.

#### 2.4.1. Alternatives

Alternatives in a rule are separated by the '|' character. The first alternative must be preceded by a '|' character.

```ldw
boolean_literal =
  | 'true'
  | 'false'
;
```

#### 2.4.2. Sequences

A sequence is a list of elements that must occur in the specified order.

```ldw
if_statement = 'if' '(' condition ')' then_branch ('else' else_branch)? ;
```

### 2.5. Rule Elements

Rule elements can be one of the following:

1. Rule references
2. Strings
3. Character sets
4. Any character (.)
5. Grouped expressions
6. Negative lookahead

#### 2.5.1. Rule References

Rule references are names of other rules in the grammar. Cross-grammar references use the '::' operator.

```ldw
expression = term (operator term)* ;
cross_grammar_ref = other_grammar::rule_name ;
```

#### 2.5.2. Strings

Strings are enclosed in single or double quotes and represent literal text to be matched.

```ldw
keyword = 'if' | 'else' | 'while' | 'for' ;
```

#### 2.5.3. Character Sets

Character sets are enclosed in square brackets and can include individual characters or character ranges.

```ldw
digit = [0-9] ;
alpha = [a-zA-Z] ;
```

The '^' character at the start of a character set indicates negation.

```ldw
not_digit = [^0-9] ;
```

#### 2.5.4. Any Character

The dot ('.') represents any single character.

```ldw
any_char = . ;
```

#### 2.5.5. Grouped Expressions

Parentheses are used to group elements within a rule.

```ldw
complex_term = ('+' | '-')? digit+ ('.' digit+)? ;
```

#### 2.5.6. Negative Lookahead

Negative lookahead is denoted by '!' followed by a character set or string.

```ldw
identifier = [a-zA-Z_] [a-zA-Z0-9_]* !'(' ;
```

### 2.6. Repetition Operators

LDW Grammar supports the following greedy repetition operators:

-   `*`: Zero or more occurrences
-   `+`: One or more occurrences
-   `?`: Zero or one occurrence

```ldw
list = '[' expression? (',' expression)* ']' ;
```

### 2.7. Labels

Labels can be attached to rule elements or alternatives using the syntax `name:`.

```ldw
binary_op = left:expression operator right:expression ;
```

### 2.8. Annotations

Rules can have annotations that modify their behavior. LDW Grammar supports two types of rule annotations:

1. `@noskip`: Indicates that trivia should not be allowed between elements of this rule.
2. `@atomic`: Indicates that this rule has no reportable substructure and should be represented as a single string. Implies `@noskip`.

```ldw
keyword @atomic = 'if' | 'else' | 'while' | 'for' ;
```

### 2.9. Version Annotations

Version annotations specify in which language versions a rule or rule element is valid. They use the syntax `@enabled(version)` or `@disabled(version)`.

```ldw
new_feature @enabled(2.0) = 'feature' expression ';' ;
```

## 3. Processing Pipeline

The LDW Grammar goes through a multi-step processing pipeline to generate the final model for an arbitrary language:

1. Parsing: The initial grammar definition is parsed according to the LDW Grammar syntax.
2. Grammar with Types: The parsed grammar is transformed into a "grammar with types" representation (ToGrammarWithTypes).
3. Final Model: The grammar with types is further transformed into the final model for the language (Transformer).

This pipeline allows for a flexible and extensible approach to language definition and model generation.

## 4. Grammar Constructs and Model Transformation

This section describes how various LDW Grammar constructs are translated into model representations for arbitrary languages. It's important to note that there are two distinct grammars involved in this process:

1. The grammar for defining LDW Grammars themselves (meta-grammar)
2. The grammar for defining the abstract model of languages (model grammar)

### 4.1. Meta-Grammar

The meta-grammar is defined in 'src/models/grammar/grammar.grammar'. This grammar describes the syntax and structure of LDW Grammar itself. It is used to parse and process other grammar definitions.

Key elements of the meta-grammar include:

-   Grammar declaration
-   Rule definitions (regular and Pratt rules)
-   Special rules (trivia, identifier, reserved_identifier)
-   Rule bodies (alternatives and sequences)
-   Rule elements (references, strings, character sets, etc.)
-   Annotations and version annotations

### 4.2. Model Grammar

The model grammar is defined in 'src/models/model/model.grammar'. This grammar describes the abstract model used to represent the structure of languages defined using LDW Grammar. The corresponding TypeScript representation of this model is in 'src/models/model/model.ts'.

Key elements of the model grammar include:

-   Model declaration
-   Definitions
-   Types (Void, Primitive, Enum, Sum, Product, Generic types)
-   Member modifications (additions and deletions)

### 4.3. Transformation Process

When an LDW Grammar for an arbitrary language is processed, it goes through the following transformation steps:

1. The grammar is parsed using the meta-grammar.
2. The parsed grammar is transformed into a "grammar with types" representation.
3. This representation is then used to generate an abstract model of the language, following the structure defined by the model grammar.

Here's how some key constructs from an arbitrary LDW Grammar are transformed into the abstract model:

#### 4.3.1. Grammar

A grammar definition is transformed into a `Model` object containing:

-   name: The name of the grammar
-   parentName: Optional, for grammar inheritance
-   values: An array of `Definition`, `Deletion`, or `MemberModification` objects

```typescript
export class Model {
    constructor(
        public name: Id,
        public parentName: Id | undefined,
        public values: (Definition | Deletion | MemberModification)[]
    ) {}
}
```

#### 4.3.2. Rules

Rules in the LDW Grammar are generally transformed into `Definition` objects in the abstract model. The right-hand side of the rule is transformed into a `Type`.

```typescript
export class Definition {
    constructor(
        public name: Id,
        public type: Type
    ) {}
}
```

#### 4.3.3. Alternatives

Alternatives in a rule are typically transformed into a `SumType` in the abstract model.

```typescript
export class SumType {
    constructor(public members: Type[]) {}
}
```

#### 4.3.4. Sequences

Sequences in a rule are typically transformed into a `ProductType` in the abstract model.

```typescript
export class ProductType {
    constructor(public members: ProductMember[]) {}
}

export class ProductMember {
    constructor(
        public name: Id,
        public type: Type
    ) {}
}
```

#### 4.3.5. Repetition

Repetition operators are transformed into `SequenceType` objects in the abstract model.

```typescript
export class SequenceType {
    constructor(public elementType: Type) {}
}
```

#### 4.3.6. Optional Elements

Optional elements are transformed into `OptionType` objects in the abstract model.

```typescript
export class OptionType {
    constructor(public type: Type) {}
}
```

#### 4.3.7. Labels

Labels in the LDW Grammar are used to generate named members in `ProductType` objects.

#### 4.3.8. Pratt Rules

Pratt rules are transformed into a combination of `SumType` and `ProductType` objects that represent the expression structure with operator precedence.

## 5. Trivia Handling

Trivia in LDW Grammar refers to elements of the input that are typically ignored by the parser for the purposes of creating the abstract syntax tree, but may be significant for formatting and documentation. Common examples include whitespace and comments.

Trivia can appear between all elements in all rules except those marked as `@noskip` or `@atomic`.

Example trivia definition:

```ldw
trivia        @noskip = | line_comment | block_comment | whitespace ;
line_comment  @atomic = '//' [^\n]* '\n'? ;
block_comment @atomic = '/*' ( | [^*]+ | '*' !'/' )* '/' ;
whitespace    @atomic = [\n\t ]+ ;
```

In the abstract model, trivia is represented as:

```typescript
export type Trivia = LineComment | BlockComment | Whitespace;

export class BlockComment {
    constructor(public value: string) {}
}

export class LineComment {
    constructor(public value: string) {}
}

export class Whitespace {
    constructor(public value: string) {}
}
```

## 6. Pratt Parsing

LDW Grammar uses Pratt parsing (also known as top-down operator precedence parsing) to handle expression grammars with operators. Pratt rules allow the designer to specify operator precedence and associativity in a concise manner.

In Pratt rules:

-   Operators are listed in order of precedence, with the highest precedence first.
-   The `primary` rule serves as the base case for parsing.
-   Operator definitions do not include references to their operands, which are implied to be the enclosing Pratt rule.

## 7. Identifier Handling

LDW Grammar handles identifiers through a special `identifier` rule. This rule is used to match any identifier and also to avoid conflicts with keywords. The `reserved_identifier` rule is used to list identifiers that are or were reserved for use by the language.

## 8. Versioning

LDW Grammar includes a versioning system that allows grammar definitions to evolve over time while maintaining backward compatibility. Version annotations (`@enabled` and `@disabled`) can be applied to entire rules, individual elements within a rule, or alternatives within a rule.

In the abstract model, version annotations are represented as:

```typescript
export class VersionAnnotation {
    constructor(
        public type: VersionAnnotationType,
        public version: VersionNumber
    ) {}
}

export enum VersionAnnotationType {
    Enabled = '@enabled',
    Disabled = '@disabled'
}

export class VersionNumber {
    constructor(public segments: VersionSegment[]) {}
}
```

## 9. Cross-Grammar References

LDW Grammar allows rules to reference rules in other grammars using the '::' operator. This feature enables modular grammar design and language embedding.

In the abstract model, cross-grammar references are represented using the `NamedTypeReference` class:

```typescript
export class NamedTypeReference {
    constructor(public names: Id[]) {}
}
```

## 10. Rule Structure Preservation

All rules that are not explicitly marked as `@atomic` should preserve their substructure in any abstract model derived from the grammar. The `@atomic` annotation indicates that a rule represents a single span of text without recorded internal structure.

## 11. Grammar Type

LDW Grammar may require backtracking to parse correctly. They are not required to be LL(k) or LR(k) grammars.

## 12. Best Practices and Guidelines

1. Use descriptive rule names that reflect the structure or concept being defined.
2. Organize rules logically, grouping related rules together.
3. Use comments to explain complex rules or provide examples.
4. When using versioning, strive to maintain backward compatibility where possible.
5. Use Pratt rules for expression grammars with complex operator precedence.
6. Leverage cross-grammar references for modular design and language embedding.
7. Define trivia rules clearly to ensure consistent handling of whitespace and comments.
8. Pay special attention to rules with repetition, alternation, or nested structures to ensure proper structure preservation.
9. Use the special `identifier` and `reserved_identifier` rules to handle identifiers and keywords effectively.

## 13. Conclusion

The LDW Grammar specification, combined with its processing pipeline and model transformation, provides a powerful and flexible system for defining and working with formal grammars. By translating grammar constructs into a structured abstract model, it enables sophisticated language processing tasks, including parsing, analysis, and code generation.

The distinction between the meta-grammar (for defining LDW Grammars) and the model grammar (for representing the abstract structure of languages) allows for a clear separation of concerns and enables the Language Definition Workbench to handle a wide variety of language definitions consistently.

As you work with LDW Grammar and its associated tools, keep in mind the relationship between the grammar constructs, their model representations, and the abstract model of the language being defined. This understanding will allow you to create more effective and maintainable language definitions, and to leverage the full power of the generated models in your language processing workflows.
