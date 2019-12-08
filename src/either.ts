class Right<T> {
  private _tag = 'right';
  constructor(readonly _value: T) {}
}
class Left<T> {
  private _tag = 'left';
  constructor(readonly _error: Error) {}
}

export type Either<T> = Right<T> | Left<T>;

export const right = <T>(value: T): Either<T> => {
  return new Right(value);
};

export const left = <T>(error: Error): Either<T> => {
  return new Left(error);
};

export const isRight = <T>(value: Either<T>): boolean => {
  return value instanceof Right;
};

export const isLeft = <T>(value: Either<T>): boolean => {
  return !(value instanceof Right);
};

export const withDefault = <T>(value: Either<T>, defaultValue: T): T => {
  switch (isLeft(value)) {
    case true:
      return defaultValue;
    case false:
      return (value as Right<T>)._value;
  }
};

export const map = <A, B>(f: (a: A) => B, value: Either<A>): Either<B> => {
  switch (isLeft(value)) {
    case true:
      return value as Either<B>;
    case false:
      try {
        return right(f((value as Right<A>)._value));
      } catch (error) {
        return left(error);
      }
  }
};

export const andThen = <A, B>(
  f: (a: A) => Either<B>,
  value: Either<A>
): Either<B> => {
  switch (isLeft(value)) {
    case true:
      return value as Left<B>;
    case false:
      return f((value as Right<A>)._value);
  }
};

export const caseOf = <A, B>(
  caseof: {
    Right: (v: A) => B;
    Left: (v: Error) => any;
  },
  value: Either<A>
): Promise<B> => {
  switch (isLeft(value)) {
    case true:
      return Promise.reject(caseof.Left((value as Left<A>)._error));
    case false:
      return Promise.resolve(caseof.Right((value as Right<A>)._value));
  }
};
