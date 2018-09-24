export class Right<T> {
  private _tag = 'right';
  constructor(readonly _value: T) {}
}
export class Left<E> {
  private _tag = 'left';
  constructor(readonly _error: E) {}
}

export type Either<T, E> = Right<T> | Left<E>;

const assertIsEither = function<T, E>(value: Either<T, E>) {
  if (!(value instanceof Right || value instanceof Left)) {
    throw new Error(`Value "${value}" is not an Either type`);
  }
};

export const right = <T>(value: T): Right<T> => {
  return new Right(value);
};

export const left = <E>(error: E): Left<E> => {
  return new Left(error);
};

export const isRight = <T, E>(value: Either<T, E>) => {
  assertIsEither(value);
  return value instanceof Right;
};

export const isLeft = <T, E>(value: Either<T, E>) => {
  assertIsEither(value);
  return value instanceof Left;
};

export const withDefault = <T, E>(value: Either<T, E>, defaultValue: T): T => {
  switch (isLeft(value)) {
    case true:
      return defaultValue;
    case false:
      return (value as Right<T>)._value;
  }
};

export const map = <A, B, E = Error>(
  f: (a: A) => B,
  value: Either<A, E>
): Either<B, E> => {
  switch (isLeft(value)) {
    case true:
      return value as Left<E>;
    case false:
      try {
        return right(f((value as Right<A>)._value));
      } catch (error) {
        return left(error);
      }
  }
};

export const andThen = <A, B, E = Error>(
  f: (a: A) => Either<B, E>,
  value: Either<A, E>
): Either<B, E> => {
  switch (isLeft(value)) {
    case true:
      return value as Left<E>;
    case false:
      return f((value as Right<A>)._value);
  }
};

export const caseOf = <A, B, E = Error>(
  caseof: {
    Right: (v: A) => B;
    Left: (v: E) => B;
  },
  value: Either<A, E>
): B => {
  switch (isLeft(value)) {
    case true:
      return caseof.Left((value as Left<E>)._error);
    case false:
      return caseof.Right((value as Right<A>)._value);
  }
};
