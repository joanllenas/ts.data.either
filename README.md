# Either

[![Build Status](https://travis-ci.org/joanllenas/ts.data.either.svg?branch=master)](https://travis-ci.org/joanllenas/ts.data.either)
[![npm version](https://badge.fury.io/js/ts.data.either.svg)](https://badge.fury.io/js/ts.data.either)

The Either type encapsulates the idea of a calculation that might have failed.

An Either value can either be `Right` some value or `Left` some error.

```ts
type Either<T, E> = Right<T> | Left<E>;
```

## Install

```
npm install ts.data.either --save
```

## Example

```ts
import { right, map, withDefault } from 'ts.data.either';

const head = (arr: number[]): number => {
  if (arr.length === 0) {
    throw new Error('Array is empty');
  }
  return arr.slice(0, 1)[0];
};

// successful operation
let wrappedValue = map(head, right([99, 109, 22, 65])); // Right(100)
let num = withDefault(wrappedValue, 0); // unwrap the value from Either
console.log(num); // 100

// failing operation
wrappedValue = map(head, right([])); // Left(Error('Array is empty'))
num = withDefault(wrappedValue, 0); // unwrap the value from Either
console.log(num); // 0
```

## Api

_(Inspired by elm-lang)_

### right

`right<T>(value: T): Right<T>`

Wraps a value in an instance of `Right`.

```ts
right(5); // Right<number>(5)
```

### left

`left<E>(error: E): Left<E>`

Creates an instance of `Left`.

```ts
left('Something bad happened'); // Left<string>('Something bad happened')
```

### isRight

`isRight<T, E>(value: Either<T, E>)`

Returns true if a value is an instance of `Right`.

```ts
isRight(left('error')); // false
```

### isLeft

`isLeft<T, E>(value: Either<T, E>)`

Returns true if a value is an instance of `Left`.

```ts
isLeft(right(5)); // false
```

### withDefault

`withDefault<T, E>(value: Either<T, E>, defaultValue: T): T`

If `value` is an instance of `Right` it returns its wrapped value, if it's an instance of `Left` it returns the `defaultValue`.

```ts
withDefault(right(5), 0); // 5
withDefault(left('error'), 0); // 0
```

### caseOf

`caseOf = <A, B, E = Error>(caseof: {Right: (v: A) => B; Left: (v: E) => B;}, value: Either<A, E> ): B`

Run different computations depending on whether an `Either` is `Right` or `Left`.

```ts
caseOf(
  {
    Left: () => 'zzz',
    Right: n => `Launch ${n} missiles`
  },
  right(5)
); // 'Launch 5 missiles'
```

### map

`map<A, B, E = Error>(f: (a: A) => B, value: Either<A, E>): Either<B, E>`

Transforms an `Either` value with a given function.

```ts
const add1 = (n: number) => n + 1;
map(add1, right(4)); // Right<number>(5)
map(add1, left('errors')); // Left('errors')
```

### andThen

`andThen<A, B, E = Error>(f: (a: A) => Either<B, E>, value: Either<A, E>): Either<B, E>`

Chains together many computations that may fail.

```ts
const removeFirstElement = <T>(arr: T[]): T[] => {
  if (arr.length === 0) {
    throw new Error('Array is empty');
  }
  return arr.slice(1);
};
const removeFirstLifted = <T, E>(arr: T[]): Either<T[], E> => {
  try {
    return right(removeFirstElement(arr));
  } catch (error) {
    return left(error);
  }
};
const result = andThen(
  arr => andThen(arr2 => removeFirstLifted(arr2), removeFirstLifted(arr)),
  removeFirstLifted(['a', 'b'])
);
withDefault(result, ['default val']); // 'default val'
```
