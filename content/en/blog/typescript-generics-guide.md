---
title: "Mastering TypeScript Generics: A Practical Guide"
slug: typescript-generics-guide-en
description: Deep dive into TypeScript generics with practical examples covering generic functions, classes, constraints, and advanced patterns for type-safe code.
summary: Master **TypeScript generics** from basics to advanced patterns, including generic constraints, conditional types, and real-world utility type implementations.
keywords: [typescript, generics, type safety, javascript, frontend]
media: https://media.giphy.com/media/ln7z2eWriiQAllfVcn/giphy.gif
tags:
- Development
- TypeScript
- Frontend
- Tutorial
draft: true
---

## Introduction

Generics are one of TypeScript's most powerful features, enabling you to write flexible, reusable code while maintaining full type safety. If you've ever found yourself using `any` to make code work with multiple types, generics are your solution.

This guide takes you from basic generic syntax to advanced patterns used in production applications.

## Why Generics?

Consider a function that returns the first element of an array:

{{< highlight typescript >}}
// Without generics - loses type information
function firstElement(arr: any[]): any {
  return arr[0];
}

const num = firstElement([1, 2, 3]);     // type: any
const str = firstElement(['a', 'b']);    // type: any

// With generics - preserves type information
function firstElementGeneric<T>(arr: T[]): T | undefined {
  return arr[0];
}

const num2 = firstElementGeneric([1, 2, 3]);   // type: number
const str2 = firstElementGeneric(['a', 'b']);  // type: string
{{< / highlight >}}

## Basic Generic Syntax

The `<T>` syntax declares a type parameter that acts as a placeholder:

{{< highlight typescript >}}
// Generic function
function identity<T>(value: T): T {
  return value;
}

// Generic arrow function
const identity2 = <T>(value: T): T => value;

// Generic interface
interface Container<T> {
  value: T;
  getValue(): T;
}

// Generic type alias
type Result<T> = { success: true; data: T } | { success: false; error: string };
{{< / highlight >}}

## Multiple Type Parameters

Functions can have multiple type parameters:

{{< highlight typescript >}}
function pair<T, U>(first: T, second: U): [T, U] {
  return [first, second];
}

const result = pair('hello', 42);  // type: [string, number]

// Map-like function
function mapObject<K extends string, V, R>(
  obj: Record<K, V>,
  fn: (value: V, key: K) => R
): Record<K, R> {
  const result = {} as Record<K, R>;
  for (const key in obj) {
    result[key] = fn(obj[key], key);
  }
  return result;
}
{{< / highlight >}}

## Generic Constraints

Use `extends` to constrain what types can be used:

{{< highlight typescript >}}
// Must have a length property
interface Lengthwise {
  length: number;
}

function logLength<T extends Lengthwise>(item: T): T {
  console.log(item.length);
  return item;
}

logLength('hello');        // OK - string has length
logLength([1, 2, 3]);      // OK - array has length
logLength({ length: 10 }); // OK - object with length
// logLength(123);         // Error - number has no length

// Constrain to object keys
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const person = { name: 'Alice', age: 30 };
const name = getProperty(person, 'name');  // type: string
const age = getProperty(person, 'age');    // type: number
// getProperty(person, 'email');           // Error - 'email' not in keyof person
{{< / highlight >}}

## Generic Classes

Classes can also be generic:

{{< highlight typescript >}}
class Stack<T> {
  private items: T[] = [];

  push(item: T): void {
    this.items.push(item);
  }

  pop(): T | undefined {
    return this.items.pop();
  }

  peek(): T | undefined {
    return this.items[this.items.length - 1];
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }
}

const numberStack = new Stack<number>();
numberStack.push(1);
numberStack.push(2);
const top = numberStack.pop();  // type: number | undefined

const stringStack = new Stack<string>();
stringStack.push('hello');
{{< / highlight >}}

## Default Type Parameters

Provide default types for optional flexibility:

{{< highlight typescript >}}
interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  message: string;
}

// Uses default type (unknown)
const response1: ApiResponse = { data: {}, status: 200, message: 'OK' };

// Specifies type
const response2: ApiResponse<User[]> = {
  data: [{ id: 1, name: 'Alice' }],
  status: 200,
  message: 'OK'
};
{{< / highlight >}}

## Conditional Types

Create types that depend on conditions:

{{< highlight typescript >}}
// Basic conditional type
type IsString<T> = T extends string ? true : false;

type A = IsString<string>;  // true
type B = IsString<number>;  // false

// Extract return type from function
type ReturnOf<T> = T extends (...args: any[]) => infer R ? R : never;

function greet(): string { return 'hello'; }
type GreetReturn = ReturnOf<typeof greet>;  // string

// Flatten array types
type Flatten<T> = T extends Array<infer U> ? U : T;

type Str = Flatten<string[]>;    // string
type Num = Flatten<number>;      // number
{{< / highlight >}}

## Mapped Types with Generics

Transform types systematically:

{{< highlight typescript >}}
// Make all properties optional
type Partial<T> = {
  [K in keyof T]?: T[K];
};

// Make all properties required
type Required<T> = {
  [K in keyof T]-?: T[K];
};

// Make all properties readonly
type Readonly<T> = {
  readonly [K in keyof T]: T[K];
};

// Pick specific properties
type Pick<T, K extends keyof T> = {
  [P in K]: T[P];
};

// Custom: Make specific properties optional
type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

interface User {
  id: number;
  name: string;
  email: string;
}

type UserWithOptionalEmail = PartialBy<User, 'email'>;
{{< / highlight >}}

## Real-World Patterns

### Type-Safe Event Emitter

{{< highlight typescript >}}
type EventMap = {
  userLoggedIn: { userId: string; timestamp: Date };
  userLoggedOut: { userId: string };
  error: { message: string; code: number };
};

class TypedEventEmitter<T extends Record<string, any>> {
  private listeners: {
    [K in keyof T]?: Array<(payload: T[K]) => void>;
  } = {};

  on<K extends keyof T>(event: K, listener: (payload: T[K]) => void): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event]!.push(listener);
  }

  emit<K extends keyof T>(event: K, payload: T[K]): void {
    this.listeners[event]?.forEach(listener => listener(payload));
  }
}

const emitter = new TypedEventEmitter<EventMap>();

emitter.on('userLoggedIn', (payload) => {
  // payload is typed as { userId: string; timestamp: Date }
  console.log(payload.userId, payload.timestamp);
});

emitter.emit('userLoggedIn', { userId: '123', timestamp: new Date() });
{{< / highlight >}}

### Type-Safe API Client

{{< highlight typescript >}}
interface ApiEndpoints {
  '/users': { response: User[]; params: { limit?: number } };
  '/users/:id': { response: User; params: { id: string } };
  '/posts': { response: Post[]; params: { userId?: string } };
}

async function fetchApi<T extends keyof ApiEndpoints>(
  endpoint: T,
  params?: ApiEndpoints[T]['params']
): Promise<ApiEndpoints[T]['response']> {
  const url = new URL(endpoint, 'https://api.example.com');
  // ... implementation
  return {} as ApiEndpoints[T]['response'];
}

// Fully typed!
const users = await fetchApi('/users', { limit: 10 });  // User[]
const user = await fetchApi('/users/:id', { id: '123' }); // User
{{< / highlight >}}

## Common Generic Utility Types

| Utility | Description | Example |
|---------|-------------|---------|
| `Partial<T>` | All properties optional | `Partial<User>` |
| `Required<T>` | All properties required | `Required<Config>` |
| `Readonly<T>` | All properties readonly | `Readonly<State>` |
| `Pick<T, K>` | Select specific properties | `Pick<User, 'id' \| 'name'>` |
| `Omit<T, K>` | Remove specific properties | `Omit<User, 'password'>` |
| `Record<K, V>` | Object with key type K, value type V | `Record<string, number>` |
| `Extract<T, U>` | Extract types assignable to U | `Extract<'a' \| 'b', 'a'>` |
| `Exclude<T, U>` | Remove types assignable to U | `Exclude<'a' \| 'b', 'a'>` |

## Best Practices

1. **Name type parameters meaningfully**: Use `TItem`, `TKey`, `TValue` instead of just `T` when it adds clarity
2. **Start simple**: Don't over-engineer with generics until you need reusability
3. **Use constraints**: Always constrain type parameters when you need specific properties
4. **Prefer interfaces for extendability**: Generic interfaces can be extended; type aliases cannot
5. **Document complex generics**: Add JSDoc comments explaining type parameters

## Conclusion

Generics are essential for writing type-safe, reusable TypeScript code. Start with simple generic functions and gradually adopt more advanced patterns as needed. The investment in learning generics pays off with fewer runtime errors and better IDE support.

Key takeaways:
- Use generics instead of `any` for flexible, type-safe code
- Constraints with `extends` ensure type parameters have required properties
- Conditional types enable powerful type transformations
- Built-in utility types cover most common use cases
