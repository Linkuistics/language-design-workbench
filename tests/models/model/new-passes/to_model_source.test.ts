import { Model } from '../../../../src/models/model/model';
import { FromModelSource } from '../../../../src/models/model/passes/from_model-source';
import { ToModelSource } from '../../../../src/models/model/passes/to_model-source';
import { modelsAreEqual } from '../../../../src/models/model/util';
import { ParseError } from '../../../../src/parser/parseError';
import { IncrementalModelGenerator } from '../incremental-model-generator';

describe('ToLDWMSource', () => {
    it('should correctly transform and parse back incrementally generated models', () => {
        const iterations = 20;
        for (let i = 0; i < iterations; i++) {
            const generator = new IncrementalModelGenerator(100);
            for (const { model, change } of generator) {
                testModelTransformation(model, change);
            }
        }
    });
});

function testModelTransformation(model: Model, changeDescription: string) {
    const toLDWMSource = new ToModelSource();
    const fromLDWMSource = new FromModelSource();

    let ldwmSource: string;
    let parsedModel: Model;

    try {
        ldwmSource = toLDWMSource.transform(model);
    } catch (error) {
        console.error(
            `Error transforming model to LDWM source after change: ${changeDescription}`
        );
        console.error(error);
        throw error;
    }

    try {
        parsedModel = fromLDWMSource.transform(ldwmSource);
    } catch (error) {
        console.error(`Parsing error after change: ${changeDescription}`);
        console.error('Generated LDWM Source:', ldwmSource);
        if (error instanceof ParseError) {
            console.error('Error:', error.toString());
        } else {
            console.error('Error:', error);
        }
        throw error;
    }

    const modelsEqual = modelsAreEqual(model, parsedModel);

    if (!modelsEqual) {
        console.error(
            `Models are not equal after change: ${changeDescription}`
        );
        console.error('Original Model:', JSON.stringify(model, null, 2));
        console.error('Generated LDWM Source:', ldwmSource);
        console.error('Parsed Model:', JSON.stringify(parsedModel, null, 2));
    }

    expect(modelsEqual).toBe(true);
}
