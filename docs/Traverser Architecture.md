# Generic Traverser Architecture

## Table of Contents

- [Generic Traverser Architecture](#generic-traverser-architecture)
  - [Table of Contents](#table-of-contents)
  - [Introduction](#introduction)
  - [Generic Architecture](#generic-architecture)
    - [TraverseDelegate Interface](#traversedelegate-interface)
    - [Traverser Class](#traverser-class)
  - [Deriving the Traverser from the Model](#deriving-the-traverser-from-the-model)
  - [Detailed Translation Process](#detailed-translation-process)
    - [1. Translating Classes to Visit Methods](#1-translating-classes-to-visit-methods)
    - [2. Handling Union Types](#2-handling-union-types)
    - [3. Dealing with Nested Structures](#3-dealing-with-nested-structures)
    - [4. Managing Generic Types](#4-managing-generic-types)
    - [5. Handling Primitive Types and Interfaces](#5-handling-primitive-types-and-interfaces)
  - [Using the Traverser](#using-the-traverser)
  - [Conclusion](#conclusion)

## Introduction

The traverser is a powerful component in software systems that work with structured data models. It provides a flexible and extensible way to traverse and potentially modify tree-like structures, such as abstract syntax trees (ASTs) or any hierarchical data model. This document describes the generic architecture of the traverser, explains how to derive it from a model, and demonstrates how to use it effectively.

## Generic Architecture

The traverser architecture consists of two main components:

1. `TraverseDelegate` interface
2. `Traverser` class

### TraverseDelegate Interface

The `TraverseDelegate` interface defines a set of optional methods that correspond to each node type in your data model. These methods allow custom behavior to be implemented for specific node types during traversal.

```typescript
export interface TraverseDelegate {
    visitNodeType1?(node: NodeType1, traverser: Traverser): NodeType1;
    visitNodeType2?(node: NodeType2, traverser: Traverser): NodeType2;
    // ... other visit methods for each node type in your model
}
```

Key points about the TraverseDelegate Interface:

1. **Optional Methods**: Each method in the interface is marked with a `?`, making it optional. This allows you to implement only the methods you need for your specific use case. You don't have to provide implementations for all node types if you don't need custom behavior for them.

2. **Return Value**: The return value of each visit method is crucial. It serves two purposes:

    - **Replacement**: You can return a new object to replace the original node in the data structure.
    - **No Change**: If you don't want to replace the node, simply return the original object.

3. **In-place Mutation**: It's important to note that you can also mutate the object in-place within the visit method. In this case, you would still return the same object, but its properties may have been modified.

4. **Traverser Parameter**: Each method receives a `traverser` parameter, allowing you to call other visit methods if needed, enabling complex traversal logic.

Example usage:

```typescript
const myDelegate: TraverseDelegate = {
    visitNodeType1(node: NodeType1, traverser: Traverser): NodeType1 {
        // Mutate the node in-place
        node.someProperty = newValue;
        return node; // Return the same object, now modified

        // OR

        // Create and return a new object, effectively replacing the original
        return new NodeType1(/* ... */);

        // OR

        // Make no changes
        return node;
    }
    // Other methods can be omitted if no special handling is needed
};
```

By implementing this interface, you can create custom traversal behavior for specific node types in your data model, while letting the default traversal handle the rest.

### Traverser Class

The `Traverser` class implements the core traversal logic. It uses the visitor pattern to walk through the data structure, calling appropriate methods on the delegate for each node type.

```typescript
export class Traverser {
    constructor(public delegate: TraverseDelegate) {}

    visitNodeType1(node: NodeType1): NodeType1 {
        if (this.delegate.visitNodeType1)
            return this.delegate.visitNodeType1(node, this);
        this.visitNodeType1Children(node);
        return node;
    }

    // ... other visit methods for each node type
}
```

Key features of the `Traverser` class:

1. It has a method for each node type in your data model.
2. Each method checks if a corresponding method exists in the delegate. If it does, it calls that method, allowing custom behavior.
3. If no delegate method exists, it performs a default traversal of the node's children.
4. It includes helper methods for dispatching to the correct visit method based on runtime type information.

## Deriving the Traverser from the Model

The traverser is closely tied to the structure of your data model. To derive a traverser from a model:

1. **Analyze the Model**: Examine the classes and types defined in your model.

2. **Create Visit Methods**: For each class or type in the model, create a corresponding `visit` method in the `Traverser` class and an optional method in the `TraverseDelegate` interface.

3. **Implement Traversal Logic**: In each `visit` method:

    - Check for a delegate method and call it if it exists.
    - Implement default traversal behavior for the node's children.

4. **Add Dispatch Methods**: Create methods to handle runtime type checking and dispatching to the correct `visit` method for union types or inheritance hierarchies.

## Detailed Translation Process

This section provides a detailed explanation of how to translate various constructs and patterns found in the model to methods in the Traverser class.

### 1. Translating Classes to Visit Methods

For each class in your model, create a corresponding `visit` method in the Traverser class and an optional method in the TraverseDelegate interface.

Example:

```typescript
// In your model
export class UserProfile {
    constructor(
        public id: string,
        public name: string,
        public email: string
    ) {}
}

// In your traverser
export interface TraverseDelegate {
    visitUserProfile?(profile: UserProfile, traverser: Traverser): UserProfile;
}

export class Traverser {
    visitUserProfile(profile: UserProfile): UserProfile {
        if (this.delegate.visitUserProfile)
            return this.delegate.visitUserProfile(profile, this);
        this.visitUserProfileChildren(profile);
        return profile;
    }

    visitUserProfileChildren(profile: UserProfile) {
        // Visit child nodes if any
        profile.id = this.visitString(profile.id);
        profile.name = this.visitString(profile.name);
        profile.email = this.visitString(profile.email);
    }

    visitString(str: string): string {
        // Primitive types usually don't need special handling
        return str;
    }
}
```

### 2. Handling Union Types

For union types in your model, create a dispatch method that determines the correct visit method to call based on the runtime type.

Example:

```typescript
// In your model
export type ContentItem = TextContent | ImageContent | VideoContent;

// In your traverser
export class Traverser {
    visitContentItem(item: ContentItem): ContentItem {
        if (this.delegate.visitContentItem)
            return this.delegate.visitContentItem(item, this);
        return this.dispatchContentItem(item);
    }

    dispatchContentItem(item: ContentItem): ContentItem {
        if (item instanceof TextContent) {
            return this.visitTextContent(item);
        } else if (item instanceof ImageContent) {
            return this.visitImageContent(item);
        } else {
            return this.visitVideoContent(item);
        }
    }

    // Implement visit methods for each content type
    visitTextContent(content: TextContent): TextContent {
        /* ... */
    }
    visitImageContent(content: ImageContent): ImageContent {
        /* ... */
    }
    visitVideoContent(content: VideoContent): VideoContent {
        /* ... */
    }
}
```

### 3. Dealing with Nested Structures

For classes with nested structures, create separate methods to visit the children of the node.

Example:

```typescript
// In your model
export class Department {
    constructor(
        public name: string,
        public manager: Employee,
        public employees: Employee[]
    ) {}
}

// In your traverser
export class Traverser {
    visitDepartment(department: Department): Department {
        if (this.delegate.visitDepartment)
            return this.delegate.visitDepartment(department, this);
        this.visitDepartmentChildren(department);
        return department;
    }

    visitDepartmentChildren(department: Department) {
        department.name = this.visitString(department.name);
        department.manager = this.visitEmployee(department.manager);
        for (let i = 0; i < department.employees.length; i++) {
            department.employees[i] = this.visitEmployee(
                department.employees[i]
            );
        }
    }

    visitEmployee(employee: Employee): Employee {
        // Implement employee visitation logic
        return employee;
    }
}
```

### 4. Managing Generic Types

For generic types, create a base visit method and specific methods for each concrete type.

Example:

```typescript
// In your model
export type Container<T> = Array<T> | Set<T> | Map<string, T>;

// In your traverser
export class Traverser {
    visitContainer<T>(container: Container<T>): Container<T> {
        if (this.delegate.visitContainer)
            return this.delegate.visitContainer(container, this);
        return this.dispatchContainer(container);
    }

    dispatchContainer<T>(container: Container<T>): Container<T> {
        if (Array.isArray(container)) {
            return this.visitArray(container);
        } else if (container instanceof Set) {
            return this.visitSet(container);
        } else {
            return this.visitMap(container);
        }
    }

    visitArray<T>(arr: T[]): T[] {
        for (let i = 0; i < arr.length; i++) {
            arr[i] = this.visitAny(arr[i]);
        }
        return arr;
    }

    // Implement similar methods for Set and Map

    visitAny(value: any): any {
        // Implement logic to visit any type of value
        return value;
    }
}
```

### 5. Handling Primitive Types and Interfaces

For primitive types and interfaces, create visit methods that handle them appropriately.

Example:

```typescript
// In your model
export interface Person {
    name: string;
    age: number;
}

// In your traverser
export class Traverser {
    visitString(str: string): string {
        // Primitive types usually don't need special handling
        return str;
    }

    visitNumber(num: number): number {
        // Primitive types usually don't need special handling
        return num;
    }

    visitPerson(person: Person): Person {
        if (this.delegate.visitPerson)
            return this.delegate.visitPerson(person, this);
        person.name = this.visitString(person.name);
        person.age = this.visitNumber(person.age);
        return person;
    }
}
```

By following these patterns, you can systematically translate the constructs and patterns found in your model to the methods required in the Traverser class. This approach ensures that all aspects of the model can be traversed and potentially modified, providing a powerful and flexible system for working with your data model.

## Using the Traverser

To use the traverser:

1. **Create a Custom Delegate**: Implement the `TraverseDelegate` interface, providing methods for the nodes you want to handle specially.

2. **Instantiate the Traverser**: Create a new `Traverser` instance with your custom delegate.

3. **Start the Traversal**: Call the appropriate `visit` method on your traverser, passing in the root node of your data structure.

Example usage:

```typescript
class MyCustomDelegate implements TraverseDelegate {
    visitPerson(person: Person, traverser: Traverser): Person {
        console.log(`Visiting person: ${person.name}`);
        // Perform custom logic here
        return traverser.visitPerson(person);
    }
}

const myDelegate = new MyCustomDelegate();
const traverser = new Traverser(myDelegate);

// Assuming 'myDataRoot' is the root of your data structure
const transformedData = traverser.visitAny(myDataRoot);
```

This pattern allows you to implement various transformations or analyses on your data structure by creating different delegates.

## Conclusion

The traverser architecture provides a powerful and flexible way to work with structured data models. By deriving the traverser directly from the model, it ensures that all node types are accounted for and can be visited. The use of the delegate pattern allows for easy customization of traversal behavior without modifying the core traversal logic.

This architecture is particularly useful for implementing various operations on your data structure, such as validation, transformation, or analysis. By creating different delegates, you can reuse the same traversal infrastructure for multiple purposes, keeping your code modular and maintainable.
