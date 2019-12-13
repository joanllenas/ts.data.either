import {
  isLeft,
  isRight,
  left,
  right,
  withDefault,
  map,
  andThen,
  Either,
  caseOf,
  tryCatch
} from './either';

import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);
const expect = chai.expect;

const anError = () => new Error('Something is wrong');
const add1 = (n: number) => n + 1;
const removeFirstElement = <T>(arr: T[]): T[] => {
  if (arr.length === 0) {
    throw new Error('Array is empty');
  }
  return arr.slice(1);
};
const pipeline = (initialValue: any, ...fns: Function[]) =>
  fns.reduce((acc, fn) => fn(acc), initialValue);

describe('Either', () => {
  describe('isRight', () => {
    it('should return false when Left is provided', () => {
      expect(isRight(left(anError()))).to.be.false;
    });
    it('should return true when Right is provided', () => {
      expect(isRight(right('hola'))).to.be.true;
    });
    it('should return false when a non Either type is provided', () => {
      const nonEither: any = [1, 2, 3];
      expect(isRight(nonEither)).to.be.false;
    });
    it('should return false when null or undefined is provided', () => {
      expect(isRight(null as any)).to.be.false;
      expect(isRight(undefined as any)).to.be.false;
    });
  });

  describe('isLeft', () => {
    it('should return false when Right is provided', () => {
      expect(isLeft(right('hola'))).to.be.false;
    });
    it('should return true when Left is provided', () => {
      expect(isLeft(left(anError()))).to.be.true;
    });
    it('should return true when a non Either type is provided', () => {
      const nonEither: any = [1, 2, 3];
      expect(isLeft(nonEither)).to.be.true;
    });
    it('should return true when null or undefined is provided', () => {
      expect(isLeft(null as any)).to.be.true;
      expect(isLeft(undefined as any)).to.be.true;
    });
  });

  describe('withDefault', () => {
    it('should return the Right value when Right is provided', () => {
      expect(withDefault(right(6), 0)).to.equal(6);
    });
    it('should return the default value when Left is provided', () => {
      expect(withDefault(left(anError()), 0)).to.equal(0);
    });
    it('should return the default value when a non Either type is provided', () => {
      const nonEither: any = [1, 2, 3];
      expect(withDefault(nonEither, 2)).to.eq(2);
    });
    it('should return the default value when null or undefined is provided', () => {
      expect(withDefault(null as any, 1)).to.eq(1);
      expect(withDefault(undefined as any, 1)).to.eq(1);
    });
  });

  describe('map', () => {
    it('should return Right when mapping over Right', () => {
      const four = right(4);
      const five = map(add1, four);
      expect(isRight(five)).to.be.true;
    });
    it('should return Left when mapping over Left', () => {
      const result = map(add1, left(anError()));
      expect(isLeft(result)).to.be.true;
    });
    it('should return 5 when adding 1 to Right(4)', () => {
      const four = right(4);
      const five = map(add1, four);
      expect(isRight(five)).to.be.true;
      expect(withDefault(five, 0)).to.equal(5);
    });
    it('should remove the first element of [1,2,3] succesfully', () => {
      const list = map(removeFirstElement, right([1, 2, 3]));
      expect(isRight(list)).to.be.true;
      expect(withDefault(list, [])).to.eql([2, 3]);
    });
    it('should return a Left when mapping produces an exception', () => {
      const list = map(removeFirstElement, right([]));
      expect(isLeft(list)).to.be.true;
    });
    it('should return a Left when mapping over null, undefined or any non Either type', () => {
      expect(isLeft(map(add1, null as any))).to.be.true;
      expect(isLeft(map(add1, undefined as any))).to.be.true;
      expect(isLeft(map(add1, {} as any))).to.be.true;
    });
  });

  describe('andThen', () => {
    const safeRemoveFirst = <T>(arr: T[]): Either<T[]> => {
      try {
        return right(removeFirstElement(arr));
      } catch (error) {
        return left(error);
      }
    };
    it('should perform chained Right transformations', () => {
      const result = andThen(
        arr => safeRemoveFirst(arr),
        safeRemoveFirst(['a', 'b', 'c'])
      );
      expect(withDefault(result, ['default val'])).to.eql(['c']);
    });
    it('should perform chained Right transformations and fail with Left', () => {
      const result = andThen(
        arr => andThen(arr2 => safeRemoveFirst(arr2), safeRemoveFirst(arr)),
        safeRemoveFirst(['a', 'b'])
      );
      expect(withDefault(result, ['default val'])).to.eql(['default val']);
    });
    it('should perform chained Right transformations and fail with Left 2', () => {
      const result = pipeline(
        ['a', 'b', 'c'],
        safeRemoveFirst,
        (arr: Either<string[]>) => andThen(safeRemoveFirst, arr),
        (arr: Either<string[]>) => andThen(safeRemoveFirst, arr),
        (arr: Either<string[]>) => andThen(safeRemoveFirst, arr),
        (arr: Either<string[]>) => andThen(safeRemoveFirst, arr),
        (arr: Either<string[]>) => andThen(safeRemoveFirst, arr),
        (arr: Either<string[]>) => andThen(safeRemoveFirst, arr)
      );
      expect(
        caseOf(
          {
            Right: (arr: string[]) => arr.toString(),
            Left: (err: Error) => err.message
          },
          result
        )
      ).to.equal('Array is empty');
    });
    it('should return left throw when chaining over null, undefined or any non Either type', () => {
      expect(isLeft(andThen(a => right(a), null as any))).to.be.true;
      expect(isLeft(andThen(a => right(a), undefined as any))).to.be.true;
      expect(isLeft(andThen(a => right(a), {} as any))).to.be.true;
    });
  });

  describe('caseOf', () => {
    it('should Launch 5 missiles', () => {
      expect(
        caseOf(
          {
            Left: err => `Error: ${err.message}`,
            Right: n => `Launch ${n} missiles`
          },
          right('5')
        )
      ).to.equal('Launch 5 missiles');
    });
    it('should error', () => {
      expect(
        caseOf(
          {
            Left: err => `Error: ${err.message}`,
            Right: n => `Launch ${n} missiles`
          },
          left(anError())
        )
      ).to.equal('Error: Something is wrong');
    });
  });

  describe('tryCatch', () => {
    let shouldFail: boolean;
    const fn = () => {
      if (shouldFail) {
        throw anError();
      }
      return 'Ok';
    };
    it('should convert a failing function into a Left', () => {
      shouldFail = true;
      expect(
        caseOf(
          {
            Left: err => `Error: ${err.message}`,
            Right: n => `Launch ${n} missiles`
          },
          tryCatch(fn, err => err)
        )
      ).to.equal('Error: Something is wrong');
    });
    it('should convert a successful function into a Right', () => {
      shouldFail = false;
      expect(tryCatch(fn, err => err)).to.deep.equal(right('Ok'));
    });
  });

  describe('example', () => {
    it('should work', () => {
      /**
       * getUserById( id: number ): Either<UserJson | null>;
       *
       * 1. Validate that the Json file name is valid
       * 2. Read data from file
       * 3. Parse json
       * 4. Find the user in the array and return it if found or return null otherwise
       * 5. Maybe?
       */
      interface UserJson {
        id: number;
        nickname: string;
        email: string;
        bio?: string | null;
        dob?: string | null;
      }
      const readFile = (filename: string): string => {
        const fileSystem: { [key: string]: string } = {
          'something.json': `
          [
            {
              "id": 1,
              "nickname": "rick",
              "email": "rick@c137.com",
              "bio": "Rick Sanchez of Earth Dimension C-137",
              "dob": "3139-03-04T23:00:00.000Z"
            },
            {
              "id": 2,
              "nickname": "morty",
              "email": "morty@c137.com",
              "bio": null,
              "dob": "2005-04-08T22:00:00.000Z"
            }
          ]`
        };
        const fileContents = fileSystem[filename];
        if (fileContents === undefined) {
          throw new Error(`${filename} does not exists.`);
        }
        return fileContents;
      }; // throws if file does not exists

      const getUserById = (
        filename: string,
        id: number
      ): Either<UserJson | null> => {
        const validateJsonFilename = (filename: string): Either<string> =>
          filename.endsWith('.json')
            ? right(filename)
            : left(new Error(`${filename} is not a valid json file.`));
        const readFileContent = (filename: string): Either<string> =>
          tryCatch(
            () => readFile(filename),
            err => err
          );
        const parseJson = (json: string): Either<UserJson[]> =>
          tryCatch(
            () => JSON.parse(json),
            err => new Error(`There was an error parsing this Json.`)
          );
        const findUserById = (users: UserJson[]): Either<UserJson | null> =>
          right(users.find((user: UserJson) => user.id === id) || null);
        return pipeline(
          filename,
          (fname: string) => validateJsonFilename(fname),
          (fname: Either<string>) => andThen(readFileContent, fname),
          (json: Either<string>) => andThen(parseJson, json),
          (users: Either<UserJson[]>) => andThen(findUserById, users)
        );
      };

      expect(getUserById('something.json', 2)).to.deep.equal(
        right({
          id: 2,
          nickname: 'morty',
          email: 'morty@c137.com',
          bio: null,
          dob: '2005-04-08T22:00:00.000Z'
        })
      );
      expect(getUserById('something.json', 3)).to.deep.equal(right(null));
      expect(
        caseOf(
          {
            Left: err => `Error: ${err.message}`,
            Right: n => `Launch ${n} missiles`
          },
          getUserById('nothing.json', 999)
        )
      ).to.equal('Error: nothing.json does not exists.');
    });

    it('should work simple', () => {
      /**
       * getUserById( id: number ): Either<UserJson | null>;
       *
       * 1. Validate that the Json file name is valid
       * 2. Read data from file
       * 3. Parse json
       * 4. Find the user in the array and return it if found or return null otherwise
       * 5. Maybe?
       */
      interface UserJson {
        id: number;
        nickname: string;
        email: string;
      }
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
      }; // throws if file does not exists

      const readFileContent = (filename: string): Either<string> =>
        tryCatch(
          () => readFile(filename),
          err => err
        );
      const parseJson = (json: string): Either<UserJson[]> =>
        tryCatch(
          () => JSON.parse(json),
          err => new Error(`There was an error parsing this Json.`)
        );

      const usersFull: UserJson[] = pipeline(
        'something.json',
        (fname: string) => readFileContent(fname),
        (json: Either<string>) => andThen(parseJson, json),
        (users: Either<UserJson[]>) => withDefault(users, [])
      );

      const usersEmpty: UserJson[] = pipeline(
        'nothing.json',
        (fname: string) => readFileContent(fname),
        (json: Either<string>) => andThen(parseJson, json),
        (users: Either<UserJson[]>) => withDefault(users, [])
      );

      expect(usersFull).to.deep.equal([
        {
          id: 1,
          nickname: 'rick',
          email: 'rick@c137.com'
        },
        {
          id: 2,
          nickname: 'morty',
          email: 'morty@c137.com'
        }
      ]);
      expect(usersEmpty).to.deep.equal([]);
    });
  });
});
