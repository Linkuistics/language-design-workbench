import { CountedRuleElement, GrammarLanguage, RuleReference } from '../model';
import { TraverseDelegate, Traverser } from '../traverser';
import { Counter } from '../utils';

export class AllocateLabels {
    transform(input: GrammarLanguage): GrammarLanguage {
        input.grammar = new Traverser(new LabelAllocator()).visitGrammar(
            input.grammar
        );
        return input;
    }
}

class ValueDetector implements TraverseDelegate {
    constructor(
        private counter: Counter,
        public name: string | undefined = undefined
    ) {}

    visitCountedRuleElement(
        element: CountedRuleElement,
        traverser: Traverser
    ): CountedRuleElement {
        traverser.visitCountedRuleElementChildren(element);

        let newName;
        if (element.label !== undefined) newName = element.label;
        else if (element.countableRuleElement instanceof RuleReference)
            newName =
                element.countableRuleElement.names[
                    element.countableRuleElement.names.length - 1
                ];

        if (newName !== undefined) {
            if (this.name === undefined) this.name = newName;
            else if (this.name !== newName)
                this.name = `_${this.counter.next()}`;
        }

        return element;
    }
}

class LabelAllocator implements TraverseDelegate {
    private counter: Counter = new Counter();

    visitCountedRuleElement(
        element: CountedRuleElement,
        traverser: Traverser
    ): CountedRuleElement {
        traverser.visitCountedRuleElementChildren(element);

        if (element.label === undefined) {
            const detector = new ValueDetector(this.counter);
            traverser.visitCountedRuleElement(element);
            if (detector.name !== undefined) {
                element.label = detector.name;
            }
        }
        return element;
    }
}
