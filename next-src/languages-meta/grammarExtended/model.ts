export class EnumRule {
    constructor(
        public members: { name: string, value: string }[]
    ) {}
}

export class SeparatedByRule {
    constructor(
        public element: RuleElement,
public separator: string,
public minCount: number
    ) {}
}