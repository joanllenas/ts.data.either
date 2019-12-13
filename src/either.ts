class Right<T> {
  private _tag = 'right';
  constructor(readonly _value: T) {}
}
class Left {
  private _tag = 'left';
  constructor(readonly _error: Error) {}
}

export type Either<T> = Right<T> | Left;

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
      return value as Left;
    case false:
      return f((value as Right<A>)._value);
  }
};

export const caseOf = <A, B>(
  caseof: {
    Right: (v: A) => B;
    Left: (err: Error) => B;
  },
  value: Either<A>
): B => {
  switch (isLeft(value)) {
    case true:
      return caseof.Left((value as Left)._error);
    case false:
      return caseof.Right((value as Right<A>)._value);
  }
};

export const tryCatch = <A>(
  f: () => A,
  onError: (e: Error) => Error
): Either<A> => {
  try {
    return right(f());
  } catch (e) {
    return left(onError(e));
  }
};
