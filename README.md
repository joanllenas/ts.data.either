# Either

[![Build Status](https://travis-ci.org/joanllenas/ts.data.either.svg?branch=master)](https://travis-ci.org/joanllenas/ts.data.either)
[![npm version](https://badge.fury.io/js/ts.data.either.svg)](https://badge.fury.io/js/ts.data.either)

The `Either` data type encapsulates the idea of a computation that may fail.

An `Either` value can either be `Right` some value or `Left` some error.

```ts
type Either<T> = Right<T> | Left;
```

> If this is new to you, you may want to read the introductory article [Safer code with container types](https://blog.logrocket.com/safer-code-with-container-types-either-and-maybe/) about why and how to use this library.

## Install

```
npm install ts.data.either --save
```

## Example

```ts
import { Either, tryCatch, andThen, withDefault } from './either';

interface UserJson {
  id: number;
  nickname: string;
  email: string;
}

// throws if file does not exists
const readFile = (filename: string): string => {
  const fileSystem: { [key: string]: string } = {
    'something.json': `
    [
      {
        "id": 1,
        "nickname": "rick",
        "email": "rick@c137.com"
      },
      {
        "id": 2,
        "nickname": "morty",
        "email": "morty@c137.com"
      }
    ]`
  };
  const fileContents = fileSystem[filename];
  if (fileContents === undefined) {
    throw new Error(`${filename} does not exists.`);
  }
  return fileContents;
};

// Wraps the read file operation in an Either
const readFileContent = (filename: string): Either<string> =>
  tryCatch(
    () => readFile(filename),
    err => err
  );

// Wraps the json parsing operation in an Either
const parseJson = (json: string): Either<UserJson[]> =>
  tryCatch(
    () => JSON.parse(json),
    err => new Error(`There was an error parsing this Json.`)
  );

// The pipeline function just makes function invocations flow
const pipeline = (initialValue: any, ...fns: Function[]) =>
  fns.reduce((acc, fn) => fn(acc), initialValue);

const usersFull: UserJson[] = pipeline(
  'something.json',
  (fname: string) => readFileContent(fname),
  (json: Either<string>) => andThen(parseJson, json),
  (users: Either<UserJson[]>) => withDefault(users, [])
); // returns the Array of users because all intermediate operations have succeeded

const usersEmpty: UserJson[] = pipeline(
  'nothing.json',
  (fname: string) => readFileContent(fname),
  (json: Either<string>) => andThen(parseJson, json),
  (users: Either<UserJson[]>) => withDefault(users, [])
); // returns an empty Array because the readFile operations failed
```

## Api

_(Inspired by elm-lang)_

### right

`right<T>(value: T): Either<T>`

Wraps a value in an instance of `Right`.

```ts
right(5); // Right<number>(5)
```

### left

`left<T>(error: Error): Either<T>`

Creates an instance of `Left`.

```ts
left(new Error('Something bad happened')); // Left<unknown>(Error('Something bad happened'))
left<number>(new Error('The calculation failed')); // Left<number>(Error('The calculation failed'))
```

### isRight

`isRight<T>(value: Either<T>): boolean`

Returns true if a value is an instance of `Right`.

```ts
isRight(left(new Error('Wrong!'))); // false
```

### isLeft

`isLeft<T>(value: Either<T>): boolean`

Returns true if a value is not an instance of `Right`.

```ts
isLeft(right(5)); // false
isLeft(left('Hi!')); // true
isLeft(null); // true
```

### withDefault

`withDefault<T>(value: Either<T>, defaultValue: T): T`

If `value` is an instance of `Right` it returns its wrapped value, if it's an instance of `Left` it returns the `defaultValue`.

```ts
withDefault(right(5), 0); // 5
withDefault(left(new Error('Wrong!')), 0); // 0
```

### caseOf

`caseOf<A, B>(caseof: {Right: (v: A) => B; Left: (err: Error) => B;}, value: Either<A>): B`

Run different computations depending on whether an `Either` is `Right` or `Left` and returns the result.

```ts
caseOf(
  {
    Left: err => `Error: ${err.message}`,
    Right: n => `Launch ${n} missiles`
  },
  right('5')
); // 'Launch 5 missiles'
```

### map

`map<A, B>(f: (a: A) => B, value: Either<A>): Either<B>`

Transforms an `Either` value with a given function.

```ts
const add1 = (n: number) => n + 1;
map(add1, right(4)); // Right<number>(5)
map(add1, left(new Error('Something bad happened'))); // Left('Something bad happened')
```

### tryCatch

`tryCatch<A>(f: () => A, onError: (e: Error) => Error): Either<A>`

Transforms a function (that might throw an exception) that produces `A` to a function that produces `Either<A>`.

```ts
tryCatch(
  () => JSON.parse(''),
  err => err
); // Left('Unexpected end of JSON input')
```

### andThen

`andThen<A, B>(f: (a: A) => Either<B>, value: Either<A>): Either<B>`

Chains together computations that may fail.

```ts
const removeFirstElement = <T>(arr: T[]): T[] => {
  if (arr.length === 0) {
    throw new Error('Array is empty');
  }
  return arr.slice(1);
};

const safeRemoveFirst = <T>(arr: T[]): Either<T[]> => {
  try {
    return right(removeFirstElement(arr));
  } catch (error) {
    return left(error);
  }
};

// The pipeline function just makes function invocations flow
const pipeline = (initialValue: any, ...fns: Function[]) =>
  fns.reduce((acc, fn) => fn(acc), initialValue);

const result: string[] = pipeline(
  ['a', 'b', 'c'],
  safeRemoveFirst, // Right(['b', 'c'])
  (arr: Either<string[]>) => andThen(safeRemoveFirst, arr), // Right(['b'])
  (arr: Either<string[]>) => andThen(safeRemoveFirst, arr), // Right([])
  (arr: Either<string[]>) => andThen(safeRemoveFirst, arr), // Left(Error('Array is empty'))
  (arr: Either<string[]>) => andThen(safeRemoveFirst, arr), // Left(Error('Array is empty'))
  (arr: Either<string[]>) => withDefault(arr, [])
);

console.log(result); // []
```
