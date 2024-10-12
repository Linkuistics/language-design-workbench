import * as Model from './model';

export class Visitor {
    visitEnumRule(node: Model.EnumRule): void {}

    visitSeparatedByRule(node: Model.SeparatedByRule): void {}
}
