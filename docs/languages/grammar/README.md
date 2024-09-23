# MetaSlang Backus-Naur Form (MSBNF) Specification

## 1. Introduction

MetaSlang Backus-Naur Form (MSBNF) is a grammar specification language designed to provide a robust and flexible means of defining formal grammars for programming languages and other structured text formats. MSBNF builds upon the foundations laid by Backus-Naur Form (BNF) and its extended variant (EBNF), introducing additional features to address common challenges in language design and parsing.

### 1.1. Purpose of MSBNF

The primary purpose of MSBNF is to offer language designers and parser implementers a powerful tool that combines the simplicity of BNF with advanced features for handling complex language constructs. MSBNF aims to streamline the process of grammar definition while providing mechanisms to deal with operator precedence, identifier parsing, and language versioning.

### 1.2. Relationship to BNF and EBNF

MSBNF can be seen as an evolution of BNF and EBNF. It retains the basic structure of production rules used in these earlier forms while extending their capabilities. Users familiar with BNF or EBNF will find many concepts in MSBNF familiar, but with added expressiveness and flexibility.

### 1.3. Key Features

MSBNF introduces several key features that set it apart from its predecessors:

1. Pratt Parsing: Built-in support for Pratt parsing (top-down operator precedence parsing), allowing for concise and intuitive definitions of operator precedence and associativity.
2. Trivia Handling: A mechanism for defining and managing 'trivia' - elements like whitespace and comments that are typically ignored by the parser but are essential for formatting and documentation.
3. Identifier Parsing: A specialized construct for defining identifiers that can exclude specific patterns (such as reserved words).
4. Versioning: A versioning system that allows grammar definitions to evolve over time while maintaining backward compatibility.
5. Modular Grammars: Support for references between different grammars, enabling modular grammar design and language embedding.

## 2. MSBNF Syntax

This section provides a detailed description of the MSBNF syntax, covering basic elements and structures used in grammar definitions.

### 2.1. Grammar Structure

An MSBNF grammar consists of a set of rules enclosed within a grammar declaration.

```msbnf
grammar <name> {
  // rules go here
}
```

### 2.2. Rule Types

MSBNF supports three types of rules:

1. Regular rules
2. Pratt rules
3. Identifier rules

#### 2.2.1. Regular Rules

```msbnf
<rule_name> <rule_annotation>? <version_annotation>* = <rule_body> ;
```

Example:

```msbnf
expression = term (operator term)* ;
```

#### 2.2.2. Pratt Rules

```msbnf
pratt <rule_name> <version_annotation>* {
  <operator_type> <name> <version_annotation>* = <rule_body> ;
  // ... more operators ...
  primary <name> = <rule_body> ;
}
```

Example:

```msbnf
pratt expression {
  left '+' = '+' ;
  left '*' = '*' ;
  prefix '-' = '-' ;
  primary term = number | '(' expression ')' ;
}
```

#### 2.2.3. Identifier Rules

```msbnf
identifier <rule_name> <rule_annotation>? <version_annotation>* =
  ( <rule_body> ) excluding ( <rule_body> ) ;
```

Example:

```msbnf
identifier name = ([a-zA-Z_][a-zA-Z0-9_]*) excluding ('if' | 'else' | 'while') ;
```

### 2.3. Rule Body

The rule body defines the structure of the rule and can consist of one or more alternatives.

#### 2.3.1. Alternatives

Alternatives in a rule are separated by the '|' character. The first alternative must be preceded by a '|' character.

```msbnf
boolean_literal =
  | 'true'
  | 'false'
;
```

#### 2.3.2. Sequences

A sequence is a list of elements that must occur in the specified order.

```msbnf
if_statement = 'if' '(' condition ')' then_branch ('else' else_branch)? ;
```

### 2.4. Rule Elements

Rule elements can be one of the following:

1. Rule references
2. Strings
3. Character sets
4. Any character (.)
5. Grouped expressions
6. Negative lookahead

#### 2.4.1. Rule References

Rule references are names of other rules in the grammar. Cross-grammar references use the '::' operator.

```msbnf
expression = term (operator term)* ;
cross_grammar_ref = other_grammar::rule_name ;
```

#### 2.4.2. Strings

Strings are enclosed in single or double quotes and represent literal text to be matched.

```msbnf
keyword = 'if' | 'else' | 'while' | 'for' ;
```

#### 2.4.3. Character Sets

Character sets are enclosed in square brackets and can include individual characters or character ranges.

```msbnf
digit = [0-9] ;
alpha = [a-zA-Z] ;
```

The '^' character at the start of a character set indicates negation.

```msbnf
not_digit = [^0-9] ;
```

#### 2.4.4. Any Character

The dot ('.') represents any single character.

```msbnf
any_char = . ;
```

#### 2.4.5. Grouped Expressions

Parentheses are used to group elements within a rule.

```msbnf
complex_term = ('+' | '-')? digit+ ('.' digit+)? ;
```

#### 2.4.6. Negative Lookahead

Negative lookahead is denoted by '!' followed by a character set or string.

```msbnf
identifier = [a-zA-Z_] [a-zA-Z0-9_]* !'(' ;
```

### 2.5. Repetition Operators

MSBNF supports the following greedy repetition operators:

- `*`: Zero or more occurrences
- `+`: One or more occurrences
- `?`: Zero or one occurrence

```msbnf
list = '[' expression? (',' expression)* ']' ;
```

### 2.6. Labels

Labels can be attached to rule elements or alternatives using the syntax `name:`.

```msbnf
binary_op = left:expression operator right:expression ;
```

### 2.7. Annotations

Rules can have annotations that modify their behavior. MSBNF supports two types of rule annotations:

1. `@noskip`: Indicates that trivia should not be allowed between elements of this rule.
2. `@atomic`: Indicates that this rule has no reportable substructure and should be represented as a single string. Implies `@noskip`.

```msbnf
keyword @atomic = 'if' | 'else' | 'while' | 'for' ;
```

### 2.8. Version Annotations

Version annotations specify in which language versions a rule or rule element is valid. They use the syntax `@enabled(version)` or `@disabled(version)`.

```msbnf
new_feature @enabled(2.0) = 'feature' expression ';' ;
```

## 3. Trivia Handling

Trivia in MSBNF refers to elements of the input that are typically ignored by the parser for the purposes of creating the abstract syntax tree, but may be significant for formatting or documentation. Common examples include whitespace and comments.

Trivia can appear between all elements in all rules except those marked as `@noskip` or `@atomic`.

Example trivia definition:

```msbnf
trivia        @noskip = | line_comment | block_comment | whitespace ;
line_comment  @atomic = '//' [^\n]* '\n'? ;
block_comment @atomic = '/*' ( | [^*]+ | '*' !'/' )* '/' ;
whitespace    @atomic = [\n\t ]+ ;
```

## 4. Pratt Parsing

MSBNF uses Pratt parsing (also known as top-down operator precedence parsing) to handle expression grammars with operators. Pratt rules allow the designer to specify operator precedence and associativity in a concise manner.

In Pratt rules:

- Operators are listed in order of precedence, with the highest precedence first.
- The `primary` rule serves as the base case for parsing.
- Operator definitions do not include references to their operands, which are implied to be the enclosing Pratt rule.

## 5. Identifier Parsing

MSBNF provides a mechanism to define identifiers while excluding specific patterns, such as keywords. This helps resolve conflicts between identifier parsing and keyword recognition.

## 6. Versioning

MSBNF includes a versioning system that allows grammar definitions to evolve over time while maintaining backward compatibility. Version annotations (`@enabled` and `@disabled`) can be applied to entire rules, individual elements within a rule, or alternatives within a rule.

## 7. Cross-Grammar References

MSBNF allows rules to reference rules in other grammars using the '::' operator. This feature enables modular grammar design and language embedding.

## 8. Rule Structure Preservation

All rules that are not explicitly marked as `@atomic` should preserve their substructure in any abstract model derived from the grammar. The `@atomic` annotation indicates that a rule represents a single span of text without recorded internal structure.

## 9. Grammar Type

MSBNF grammars may require backtracking to parse correctly. They are not required to be LL(k) or LR(k) grammars.

## 10. Best Practices and Guidelines

1. Use descriptive rule names that reflect the structure or concept being defined.
2. Organize rules logically, grouping related rules together.
3. Use comments to explain complex rules or provide examples.
4. When using versioning, strive to maintain backward compatibility where possible.
5. Use Pratt rules for expression grammars with complex operator precedence.
6. Leverage cross-grammar references for modular design and language embedding.
7. Define trivia rules clearly to ensure consistent handling of whitespace and comments.
8. Pay special attention to rules with repetition, alternation, or nested structures to ensure proper structure preservation.

## 11. Conclusion

MSBNF provides a powerful and flexible way to define grammars for programming languages and other structured text formats. By building on the foundations of BNF and EBNF, and introducing advanced features like Pratt parsing, versioning, and modular grammar design, MSBNF enables language designers and parser implementers to create robust and maintainable grammar specifications.

As you work with MSBNF, remember that clear, well-organized grammars lead to more understandable and maintainable language implementations. Leverage the full power of MSBNF's features, but always strive for clarity and simplicity in your grammar definitions.
