Instructions for creating `<grammar name>-generator.ts`: 
--------------------------------------------------------

The module has a single exported function, `generate`, that returns a model.

All rules and features must expressed at least once. This should include e.g.
escapes in strings.

The names you generate should be valid english syllables, not just random
characters, except in the case of items that allow non-alphabetic characters,
where you should be sure to use them occasionally as well.

If the grammar has name and reference items, only reference items that you have
defined.

Guard against infinite recursion.