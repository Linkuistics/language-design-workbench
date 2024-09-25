
import { InputStream } from './src/parser/inputStream';
import * as Model from './model';
import { Parser } from './src/parser/parser';
import { ParseError } from './src/parser/parseError';

type TriviaKind = 'LineComment' | 'BlockComment' | 'Whitespace';

export class GrammarParser extends Parser {
    constructor(input: InputStream) {
        super(input);
    }

    parse(): Model.GrammarLanguage {
        const result = this.parseGrammar();
        if (!this.isEOF()) {
            throw new ParseError(
                'Unexpected trailing content',
                this.getPosition(),
                this
            );
        }
        return new Model.GrammarLanguage(result);
    }

        private parseGrammar(): Model.Grammar {
this.must(this.consumeString('grammar'), "something"),this.must(this.parseName(), "something"),this.must(this.consumeString('{'), "something"),this.zeroOrMore(() => this.firstAlternative("something",
() => this.must(this.parseRule(), "something"),
() => this.must(this.parsePrattRule(), "something"),
() => this.must(this.parseIdentifierRule(), "something"))),this.must(this.consumeString('}'), "something")
}

private parseRule(): Model.Rule {
this.must(this.parseName(), "something"),this.parseRuleAnnotation(),this.zeroOrMore(() => this.parseVersionAnnotation()),this.must(this.consumeString('='), "something"),this.must(this.parseRuleBody(), "something"),this.must(this.consumeString(';'), "something")
}

private parseRuleAnnotation(): Model.RuleAnnotation {
this.consumeString('no_skip'),this.consumeString('atomic')
}

private parsePrattRule(): Model.PrattRule {
this.must(this.consumeString('pratt'), "something"),this.must(this.parseName(), "something"),this.zeroOrMore(() => this.parseVersionAnnotation()),this.must(this.consumeString('{'), "something"),this.oneOrMore(() => this.parsePrattOperator()),this.must(this.parsePrattPrimary(), "something"),this.must(this.consumeString('}'), "something")
}

private parsePrattOperator(): Model.PrattOperator {
this.must(this.parsePrattOperatorType(), "something"),this.must(this.parseName(), "something"),this.zeroOrMore(() => this.parseVersionAnnotation()),this.must(this.consumeString('='), "something"),this.must(this.parseRuleBody(), "something"),this.must(this.consumeString(';'), "something")
}

private parsePrattPrimary(): Model.PrattPrimary {
this.must(this.consumeString('primary'), "something"),this.must(this.parseName(), "something"),this.must(this.consumeString('='), "something"),this.must(this.parseRuleBody(), "something"),this.must(this.consumeString(';'), "something")
}

private parsePrattOperatorType(): Model.PrattOperatorType {
this.consumeString('prefix'),this.consumeString('postfix'),this.consumeString('left'),this.consumeString('right')
}

private parseIdentifierRule(): Model.IdentifierRule {
this.must(this.consumeString('identifier'), "something"),this.must(this.parseName(), "something"),this.parseRuleAnnotation(),this.zeroOrMore(() => this.parseVersionAnnotation()),this.must(this.consumeString('='), "something"),this.must(this.firstAlternative("something",
() => this.must(this.parseIdentifierWithExclusions(), "something"),
() => this.must(this.parseRuleBody(), "something")), "something")
}

private parseIdentifierWithExclusions(): Model.IdentifierWithExclusions {
this.must(this.consumeString('('), "something"),this.must(this.parseRuleBody(), "something"),this.must(this.consumeString(')'), "something"),this.must(this.consumeString('excluding'), "something"),this.must(this.consumeString('('), "something"),this.must(this.parseRuleBody(), "something"),this.must(this.consumeString(')'), "something")
}

private parseVersionAnnotation(): Model.VersionAnnotation {
this.must(this.parseVersionAnnotationType(), "something"),this.must(this.consumeString('('), "something"),this.must(this.parseVersionNumber(), "something"),this.must(this.consumeString(')'), "something")
}

private parseVersionAnnotationType(): Model.VersionAnnotationType {
this.consumeString('enabled'),this.consumeString('disabled')
}

private parseVersionNumber(): Model.VersionNumber {
this.must(this.parseVersionSegment(), "something"),this.zeroOrMore(() => this.must(this.consumeString('.'), "something"),this.must(this.parseVersionSegment(), "something"))
}

private parseVersionSegment(): Model.VersionSegment {
/* ATOMIC */
}

private parseRuleBody(): Model.RuleBody {
this.firstAlternative("something",
() => this.must(this.parseSequenceRule(), "something"),
() => this.must(this.parseAlternativeRules(), "something"))
}

private parseSequenceRule(): Model.SequenceRule {
this.oneOrMore(() => this.parseRuleElement())
}

private parseAlternativeRules(): Model.AlternativeRules {
this.oneOrMore(() => this.parseAlternative())
}

private parseAlternative(): Model.Alternative {
this.parseLabel(),this.must(this.consumeString('|'), "something"),this.zeroOrMore(() => this.parseVersionAnnotation()),this.must(this.parseSequenceRule(), "something")
}

private parseRuleElement(): Model.RuleElement {
this.firstAlternative("something",
() => this.must(this.parseCountedRuleElement(), "something"),
() => this.must(this.parseNegativeLookahead(), "something"))
}

private parseCountedRuleElement(): Model.CountedRuleElement {
this.parseLabel(),this.must(this.parseCountableRuleElement(), "something"),this.parseCount(),this.zeroOrMore(() => this.parseVersionAnnotation())
}

private parseCountableRuleElement(): Model.CountableRuleElement {
this.firstAlternative("something",
() => this.must(this.parseRuleReference(), "something"),
() => this.must(this.parseString(), "something"),
() => this.must(this.parseCharSet(), "something"),
() => this.must(this.parseAny(), "something"),
() => this.must(this.consumeString('('), "something"),this.must(this.parseRuleBody(), "something"),this.must(this.consumeString(')'), "something"))
}

private parseRuleReference(): Model.RuleReference {
this.must(this.parseName(), "something"),this.zeroOrMore(() => this.must(this.consumeString('::'), "something"),this.must(this.parseName(), "something"))
}

private parseCount(): Model.Count {
this.consumeString('one_or_more'),this.consumeString('zero_or_more'),this.consumeString('optional')
}

private parseName(): Model.Name {
/* ATOMIC */
}

private parseLabel(): Model.Label {
this.must(this.parseName(), "something"),this.must(this.consumeString(':'), "something")
}

private parseString(): Model.String {
/* ATOMIC */
}

private parseCharSet(): Model.CharSet {
this.must(this.consumeString('['), "something"),this.consumeString('^'),this.oneOrMore(() => this.must(this.parseCharSetChar(), "something"),this.must(this.consumeString('-'), "something"),this.must(this.parseCharSetChar(), "something")),this.must(this.consumeString(']'), "something")
}

private parseCharSetChar(): Model.CharSetChar {
/* ATOMIC */
}

private parseAny(): Model.Any {
this.must(this.consumeString('.'), "something")
}

private parseNegativeLookahead(): Model.NegativeLookahead {
this.must(this.consumeString('!'), "something"),this.must(this.firstAlternative("something",
() => this.must(this.parseCharSet(), "something"),
() => this.must(this.parseString(), "something")), "something")
}

private parseTrivia(): Model.Trivia {
this.firstAlternative("something",
() => this.must(this.parseLineComment(), "something"),
() => this.must(this.parseBlockComment(), "something"),
() => this.must(this.parseWhitespace(), "something"))
}

private parseLineComment(): Model.LineComment {
/* ATOMIC */
}

private parseBlockComment(): Model.BlockComment {
/* ATOMIC */
}

private parseWhitespace(): Model.Whitespace {
/* ATOMIC */
}

}
        
