import { ChoiceRule, Grammar, Rule, SeparatedByRule, SequenceRule } from '../model';
import { TraverseDelegate as ModelTraverseDelegate, Traverser as ModelTraverser } from '../../model/traverser';
import { Definition, EnumType, ProductType, SequenceType, SumType, Type, TypeWithStructure } from '../../model/model';
import { TraverseDelegate, Traverser, TraverserEngine } from '../traverser';

export class RemoveAnonymousTypes {
    transform(input: Grammar): Grammar {
        new TraverserEngine(new RuleProcessor()).visitGrammar(input);
        return input;
    }
}

class RuleProcessor implements TraverseDelegate {
    visitRule(rule: Rule, traverser: Traverser): void | Rule {
        if (rule.body instanceof SequenceRule) {
        } else if (rule.body instanceof ChoiceRule) {
        } else if (rule.body instanceof SeparatedByRule) {
        }
        return rule;
    }
}

class TypeRemover implements ModelTraverseDelegate {
    public definitions: Definition[] = [];

    constructor(private baseName: string) {}

    visitTypeWithStructure(typeWithStructure: TypeWithStructure, traverser: ModelTraverser): void | Type {}

    visitEnumType(enumType: EnumType, traverser: ModelTraverser): void | Type {}

    visitSumType(sumType: SumType, traverser: ModelTraverser): void | Type {}

    visitProductType(productType: ProductType, traverser: ModelTraverser): void | Type {}
}
