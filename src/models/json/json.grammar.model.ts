type Option<T> = T | undefined;


export class Value {
    constructor(
        public boolean:boolean,
        public number:Number,
        public string:string,
        public null:Null,
        public list:List,
        public map:Map
    ) {}
}

export enum Boolean {    True,    False,}

export class Number {
    constructor(
        public value:string
    ) {}
}

export class Ureal {
    constructor(
        public value:string
    ) {}
}

export class Uinteger {
    constructor(
        public value:string
    ) {}
}

export class Digit {
}

export class Sign {
}

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

export enum Null {    Null,}

export class List {
    constructor(
        public value:Option<Value>,
        public value:Array<Value>
    ) {}
}

export class Map {
    constructor(
        public mapEntry:Option<MapEntry>,
        public mapEntry:Array<MapEntry>
    ) {}
}

export class MapEntry {
    constructor(
        public key:string,
        public value:Value
    ) {}
}

export class Trivia {
    constructor(
        public whitespace:Whitespace,
        public lineComment:LineComment,
        public blockComment:BlockComment
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

export class Whitespace {
    constructor(
        public value:string
    ) {}
}