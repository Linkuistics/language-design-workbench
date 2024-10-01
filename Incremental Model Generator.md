# Incremental Model Generator

## Task

Refactor the random model generator for a recursive data structure to produce a sequence of models, starting with the simplest possible model and progressively becoming more complex. Each step in the sequence should represent a minimal change from the previous model.

## Requirements

1. Generate a sequence of models, not just a single random model.
2. Start with the simplest possible model and incrementally increase complexity.
3. Each step should add or change one aspect of the model minimally.
4. Provide a description of what changed at each step.
5. Handle complex changes, including wrapping existing elements (for directly recursive types).
6. Favor breadth over depth in the model structure.
7. Ensure all possible combinations of model values are exercised.
8. The sequence should be deterministic and reproducible.

## Key Components to Implement

1. ModelBuilder class: Maintains the current state of the model and provides methods for incremental changes.
2. generateModelSequence() function: Returns an array of {model, description} objects.
3. Change strategies: Define and implement various ways to modify the model (e.g., addDefinition, modifyMember, wrapType).
4. Priority queue: Manage the order of changes to ensure breadth-first exploration.
5. Minimal type generators: Create helper functions to generate minimal versions of each type.
6. Coverage tracker: Implement a mechanism to track which types and features have been exercised.

## Files to focus on

-   tests/languages/ldwm/new-passes/random-new-model-generator.ts (main file to refactor)
-   src/languages/ldwm/new-model.ts (contains model definitions)
-   src/languages/ldwm/new-util.ts (may contain useful utility functions)

## Implementation Plan

1. Create the ModelBuilder class in a new file, e.g., `model-builder.ts`.
2. Implement the generateModelSequence function in the `random-new-model-generator.ts` file.
3. Create separate files for the change strategies, priority queue, and coverage tracker.
4. Update the existing generateRandomType function to include the new minimal type generators.
5. Implement unit tests for each component to ensure they work as expected.

Please provide a detailed implementation of these components, focusing on how they will work together to meet the requirements. Ensure that the implementation is flexible enough to handle the complex recursive nature of the data structures and can generate a wide range of model variations while maintaining simplicity in each incremental step.
