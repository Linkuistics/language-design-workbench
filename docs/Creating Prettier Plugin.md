Instructions for creating `<grammar name>-prettier-plugin.ts`: 
--------------------------------------------------------------

This module defines a a prettier plugin for formatting the language.

The pretty-printed output must be parse-able by the parser previously generated
i.e. it must be a valid input to the parser. In particular, ensure you insert
whitespace between elements when printing, if the whitespace is significant to
the parsing process.

Make sure to escape characters in strings and character literals, particular
those for which the grammar provides an escaped form.

You should not force line breaks, but rather allow the pretty-printer to decide
when to break lines. However, you should insert whitespace between elements when
you would otherwise instert a line break.