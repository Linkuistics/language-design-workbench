import {
    ChoiceRule,
    CountedRuleElement,
    SequenceRule,
    StringElement
} from '../grammar/model';

export function alternativeRulesAsEnum(
    alternativeRules: ChoiceRule
): string[] | undefined {
    const enumMembers = alternativeRules.choices.map((choice) =>
        toEnumMember(choice)
    );
    if (enumMembers.every((name) => name !== undefined)) {
        return Array.from(new Set(enumMembers));
    }
    return undefined;
}

export function toEnumMember(sequenceRule: SequenceRule): string | undefined {
    if (sequenceRule.elements.length !== 1) return undefined;
    const element = sequenceRule.elements[0];
    if (!(element instanceof CountedRuleElement)) return undefined;
    if (element.count) return undefined;
    const cre = element.countableRuleElement;
    if (!(cre instanceof StringElement)) return undefined;
    if (element.label) return element.label;
    const name = cre.value.replace(/[^a-zA-Z0-9]/g, '');
    return name.length > 0 ? name : undefined;
}

export class Counter {
    constructor(public count: number = 0) {}

    public next(): number {
        return this.count++;
    }
}
