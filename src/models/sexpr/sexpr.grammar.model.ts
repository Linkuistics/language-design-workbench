type Option<T> = T | undefined;


export class Datum {
    constructor(
        public boolean:boolean,
        public character:Character,
        public number:Number,
        public string:string,
        public list:List,
        public vector:Vector,
        public byteVector:ByteVector,
        public struct:Struct,
        public symbol:Symbol
    ) {}
}

export enum Boolean {    True,    False,}

export class Number {
    constructor(
        public num2:Num2,
        public num10:Num10,
        public num16:Num16
    ) {}
}

export class Num2 {
    constructor(
        public value:string
    ) {}
}

export class Ureal2 {
    constructor(
        public value:string
    ) {}
}

export class Uinteger2 {
    constructor(
        public value:string
    ) {}
}

export class Digit2 {
    constructor(
        public value:string
    ) {}
}

export class Num10 {
    constructor(
        public value:string
    ) {}
}

export class Ureal10 {
    constructor(
        public value:string
    ) {}
}

export class Uinteger10 {
    constructor(
        public value:string
    ) {}
}

export class Digit10 {
    constructor(
        public value:string
    ) {}
}

export class Num16 {
    constructor(
        public value:string
    ) {}
}

export class Ureal16 {
    constructor(
        public value:string
    ) {}
}

export class Uinteger16 {
    constructor(
        public value:string
    ) {}
}

export class Digit16 {
    constructor(
        public value:string
    ) {}
}

export class Sign {
}

export class Character {
    constructor(
        public char:boolean,
        public characterName:CharacterName,
        public uinteger16:Uinteger16
    ) {}
}

export enum CharacterName {    Alarm,    Backspace,    Delete,    Esc,    Linefeed,    Newline,    Page,    Return,    Space,    Tab,    Vtab,}

export class String {
    constructor(
        public value:string
    ) {}
}

export class StringCharacter {
    constructor(
        public value:string
    ) {}
}

export class Symbol {
    constructor(
        public identifier:Identifier
    ) {}
}

export class List {
    constructor(
        public datum:Array<Datum>,
        public tail:Option<Option<Datum>>,
        public datum:Array<Datum>,
        public tail:Option<Option<Datum>>,
        public datum:Array<Datum>,
        public tail:Option<Option<Datum>>,
        public abbreviation:Abbreviation
    ) {}
}

export class Abbreviation {
    constructor(
        public quote:Datum,
        public quasiquote:Datum,
        public unquote:Datum,
        public unquoteSplicing:Datum
    ) {}
}

export class Vector {
    constructor(
        public datum:Array<Datum>,
        public datum:Array<Datum>,
        public datum:Array<Datum>
    ) {}
}

export class ByteVector {
    constructor(
        public number:Array<Number>,
        public number:Array<Number>,
        public number:Array<Number>
    ) {}
}

export class Struct {
    constructor(
        public name:Symbol,
        public datum:Array<Datum>,
        public name:Symbol,
        public datum:Array<Datum>,
        public name:Symbol,
        public datum:Array<Datum>
    ) {}
}

export class Identifier {
    constructor(
        public value:string
    ) {}
}

export class IdentStart {
    constructor(
        public value:string
    ) {}
}

export class IdentContinue {
    constructor(
        public value:string
    ) {}
}

export class Trivia {
    constructor(
        public whitespace:Whitespace,
        public lineComment:LineComment,
        public blockComment:BlockComment,
        public datumComment:DatumComment
    ) {}
}

export class LineComment {
    constructor(
        public value:string
    ) {}
}

export class BlockComment {
    constructor(
        public value:string
    ) {}
}

export class DatumComment {
    constructor(
        public datum:Datum
    ) {}
}

export class Whitespace {
    constructor(
        public value:string
    ) {}
}