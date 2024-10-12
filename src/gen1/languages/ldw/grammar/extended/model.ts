export class EnumRule {
    constructor(public members: { name: number; value: number }[]) {}
}

export class SeparatedByRule {
    constructor(
        public element: RuleElement,
        public separator: number,
        public minCount: number
    ) {}
}
