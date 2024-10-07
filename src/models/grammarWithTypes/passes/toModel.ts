import { Definition, Model } from '../../model/model';
import { Grammar, Rule } from '../model';
import { TraverseDelegate, Traverser } from '../traverser';

export class ToModel implements TraverseDelegate {
    private definitions: Definition[] = [];

    transform(input: Grammar): Model {
        this.definitions = input.definitions;
        new Traverser(this).visitGrammar(input);
        const output = new Model(input.name, undefined, this.definitions);
        return output;
    }

    visitRule(rule: Rule, traverser: Traverser): Rule {
        this.definitions.push(new Definition(rule.name, rule.type));
        return rule;
    }
}
