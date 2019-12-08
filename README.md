# Either

[![Build Status](https://travis-ci.org/joanllenas/ts.data.either.svg?branch=master)](https://travis-ci.org/joanllenas/ts.data.either)
[![npm version](https://badge.fury.io/js/ts.data.either.svg)](https://badge.fury.io/js/ts.data.either)

The Either data type encapsulates the idea of a computation that may fail.

An Either value can either be `Right` some value or `Left` some error.

```ts
type Either<T> = Right<T> | Left<T>;
```

## Install

```
npm install ts.data.either --save
```

## Example

```ts
import { map, Either, left, right, caseOf} from 'ts.data.either';

type Band = {
  artist: string;
  bio: string;
};
const bandsJsonWithContent: { [key: string]: string } = {
  'bands.json': `
    [
      {"artist": "Clark", "bio": "Clark bio..."},
      {"artist": "Plaid", "bio": "Plaid bio..."}
    ]
    `
};
const bandsJsonWithoutContent: { [key: string]: string } = {
  'bands.json': ''
};
const generateExample = (
  filenameToRead: string,
  folder: { [key: string]: string }
) => {
  const readFile = (filename: string): Either<string> => {
    if (folder.hasOwnProperty(filename)) {
      return right(folder[filename]);
    }
    return left(new Error(`File ${filename} doesn't exist`));
  };
  const bandsJson = readFile(filenameToRead);
  const bands = map(json => JSON.parse(json) as Band[], bandsJson);
  const bandNames = map(bands => bands.map(band => band.artist), bands);
  return bandNames;
};

// Should compute band names properly
let bandNames = generateExample('bands.json', bandsJsonWithContent);
caseOf(
  {
    Left: err => err.message,
    Right: names => names
  },
  bandNames
).then(names => console.log(names)); // ['Clark', 'Plaid']

// Should fail becasue file non-existing.json doesn't exist
bandNames = generateExample('non-existing.json', bandsJsonWithContent);
caseOf(
  {
    Left: err => err.message,
    Right: names => names
  },
  bandNames
).catch(err => console.log(err)); // File non-existing.json doesn't exist

// should fail becasue file content is not valid Json
bandNames = generateExample('bands.json', bandsJsonWithoutContent);
caseOf(
  {
    Left: err => err.message,
    Right: names => names
  },
  bandNames
).catch(err => console.log(err)); // Unexpected end of JSON input
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
left('Something bad happened'); // Left<string>('Something bad happened')
```

### isRight

`isRight<T>(value: Either<T>): boolean`

Returns true if a value is an instance of `Right`.

```ts
isRight(left(new Error('Wrong!'))); // false
```

### isLeft

`isLeft<T>(value: Either<T>): boolean`

Returns true if a value is an instance of `Left`.

```ts
isLeft(right(5)); // false
```

### withDefault

`withDefault<T>(value: Either<T>, defaultValue: T): T`

If `value` is an instance of `Right` it returns its wrapped value, if it's an instance of `Left` it returns the `defaultValue`.

```ts
withDefault(right(5), 0); // 5
withDefault(left(new Error('Wrong!')), 0); // 0
```

### caseOf

`<A, B>(caseof: {Right: (v: A) => B; Left: (v: Error) => any;}, value: Either<A>): Promise<B>`

Run different computations depending on whether an `Either` is `Right` or `Left` and returns a `Promise`

```ts
caseOf(
  {
    Left: err => `Error: ${err.message}`,
    Right: n => `Launch ${n} missiles`
  },
  right('5')
).then(res => console.log(res)); // 'Launch 5 missiles'
```

### map

`<A, B>(f: (a: A) => B, value: Either<A>): Either<B>`

Transforms an `Either` value with a given function.

```ts
const add1 = (n: number) => n + 1;
map(add1, right(4)); // Right<number>(5)
map(add1, left(new Error('Something bad happened'))); // Left('Something bad happened')
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
const result = andThen(
  arr =>
    andThen(arr2 => safeRemoveFirstElement(arr2), safeRemoveFirstElement(arr)),
  safeRemoveFirstElement(['a', 'b'])
);
withDefault(result, 'default val'); // 'default val'
```
