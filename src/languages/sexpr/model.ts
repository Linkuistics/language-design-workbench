export type Abbreviation = { quote: Datum } | { quasiquote: Datum } | { unquote: Datum } | { unquoteSplicing: Datum };
export type Character = { char: string } | { characterName: CharacterName } | Uinteger16;
export type Comment = LineComment | BlockComment | DatumComment;
export type Datum = { boolean: Boolean } | Character | Number | String | List | Vector | ByteVector | Struct | Symbol;
export type DatumComment = { boolean: Boolean } | Character | Number | String | List | Vector | ByteVector | Struct | Symbol;
export type List = { data: Datum[], tail: Datum | undefined } | Abbreviation;
export type Number = Num2 | Num10 | Num16;
export type Symbol = string;
export type Trivia = Whitespace | Comment;

export enum Boolean {
    True,
    False
}

export enum CharacterName {
    Alarm,
    Backspace,
    Delete,
    Esc,
    Linefeed,
    Newline,
    Page,
    Return,
    Space,
    Tab,
    Vtab
}

export class BlockComment {
    constructor(
        public value: string
    ) {}
}

export class ByteVector {
    constructor(
        public numbers: Number[]
    ) {}
}

export class LineComment {
    constructor(
        public value: string
    ) {}
}

export class Num10 {
    constructor(
        public value: string
    ) {}
}

export class Num16 {
    constructor(
        public value: string
    ) {}
}

export class Num2 {
    constructor(
        public value: string
    ) {}
}

export class String {
    constructor(
        public value: string
    ) {}
}

export class Struct {
    constructor(
        public name: Symbol,
        public data: Datum[]
    ) {}
}

export class Uinteger16 {
    constructor(
        public value: string
    ) {}
}

export class Vector {
    constructor(
        public data: Datum[]
    ) {}
}

export class Whitespace {
    constructor(
        public value: string
    ) {}
}
