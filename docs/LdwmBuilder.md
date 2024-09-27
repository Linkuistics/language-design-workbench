# LDWM Builder Pattern

## Overview

The LDWM Builder Pattern is a sophisticated, state-aware approach to constructing complex LDWM (Language Design Workbench Model) structures. It provides a clear and consistent way to build various types of models while maintaining type safety, reducing the potential for errors, and simplifying the client code.

### Key Concepts

1. **State-Aware Building**: The builder maintains an internal state machine, allowing for context-sensitive operations and automatic type management.
2. **Type Stack**: A stack is used to keep track of nested types during the building process.
3. **Bracketing Pattern**: Composite types use a start/end bracketing pattern for clear delineation of structure.
4. **Automatic Type Addition**: The builder automatically adds created types to their parent structures based on the current state.

## How to Use the LDWM Builder

### Initialization

```typescript
const builder = new LdwmBuilder('ModelName');
```

### Building Named Types

```typescript
builder.startNamedType('TypeName');
// ... build the type ...
builder.endNamedType();
```

### Creating Simple Types

```typescript
builder.createVoidType();
builder.createPrimitiveType('string');
builder.createPrimitiveType('boolean');
```

### Building Composite Types

#### Enum Types

```typescript
builder.startEnumType();
builder.addEnumMember('Member1');
builder.addEnumMember('Member2');
builder.endEnumType();
```

#### Product Types

```typescript
builder.startProductType();
builder.createPrimitiveType('string');
builder.addProductTypeField('field1');
builder.createPrimitiveType('boolean');
builder.addProductTypeField('field2');
builder.endProductType();
```

#### Sum Types

```typescript
builder.startSumType();
builder.createPrimitiveType('string');
builder.createPrimitiveType('boolean');
builder.endSumType();
```

### Creating Array and Optional Types

```typescript
builder.createPrimitiveType('string');
builder.createArrayType();

builder.createPrimitiveType('boolean');
builder.createOptionalType();
```

### Named Type References

```typescript
builder.createNamedTypeReference('ReferencedTypeName');
```

### Finalizing the Model

```typescript
const model = builder.build();
```

## State Machine Behavior

The builder maintains an internal state machine with the following states:

-   `ROOT`: The initial state.
-   `NAMED_TYPE`: When building a named type.
-   `ENUM`: When building an enum type.
-   `PRODUCT`: When building a product type.
-   `SUM`: When building a sum type.

The builder automatically manages these states and ensures that operations are valid for the current state. For example, you can only add enum members when in the `ENUM` state.

## Error Handling

The builder will throw errors if operations are attempted in invalid states. For example:

-   Trying to add an enum member when not in the `ENUM` state.
-   Trying to add a product type field when not in the `PRODUCT` state.
-   Ending a type (e.g., `endProductType`) when not in the corresponding state.

## Best Practices

1. Always use the bracketing methods (`start*` and `end*`) for composite types.
2. Create child types before adding them to parent types (e.g., create a field's type before calling `addProductTypeField`).
3. Ensure that all started types are properly ended.
4. Use the `build()` method only once all types have been defined.

## Creating Builders for Arbitrary Models

When creating a builder for an arbitrary model, follow these general principles:

1. **Define States**: Identify the different states your builder needs to manage.
2. **Implement State Transitions**: Use methods like `startX` and `endX` to manage state transitions.
3. **Type Stack**: Use a stack to manage nested types.
4. **Automatic Type Addition**: Implement logic to automatically add created types to their parent structures based on the current state.
5. **Error Checking**: Implement robust error checking to ensure operations are only performed in valid states.
6. **Flexible Type Creation**: Allow for creation of all necessary type variants in your model.
7. **Build Method**: Implement a `build()` method to finalize and return the complete model.

By following these principles and adapting them to your specific model's needs, you can create a builder that provides a clear, type-safe, and context-aware way to construct complex model structures.
