export type Comment = LineComment | BlockComment;
export type Trivia = Whitespace | Comment;
export type Value = { boolean: Boolean } | Number | String | Null | List | Map;

export enum Boolean {
    True,
    False
}

export class BlockComment {
    constructor(
        public value: string
    ) {}
}

export class LineComment {
    constructor(
        public value: string
    ) {}
}

export class List {
    constructor(
        public values: Value[]
    ) {}
}

export class Map {
    constructor(
        public mapEntries: MapEntry[]
    ) {}
}

export class MapEntry {
    constructor(
        public key: String,
        public value: Value
    ) {}
}

export class Null {}

export class Number {
    constructor(
        public value: string
    ) {}
}

export class String {
    constructor(
        public value: string
    ) {}
}

export class Whitespace {
    constructor(
        public value: string
    ) {}
}
