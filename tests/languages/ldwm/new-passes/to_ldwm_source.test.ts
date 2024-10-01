import { Model } from '../../../../src/languages/ldwm/new-model';
import { FromLDWMSource } from '../../../../src/languages/ldwm/new-passes/from_ldwm-source';
import { ToLDWMSource } from '../../../../src/languages/ldwm/new-passes/to_ldwm-source';
import { modelsAreEqual } from '../../../../src/languages/ldwm/new-util';
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
    const toLDWMSource = new ToLDWMSource();
    const fromLDWMSource = new FromLDWMSource();

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
