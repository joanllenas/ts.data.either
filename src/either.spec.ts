import {
  isLeft,
  isRight,
  left,
  right,
  withDefault,
  map,
  andThen,
  Either,
  caseOf
} from './either';

import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);
const expect = chai.expect;

const createError = <T>(value: T) => `Value "${value}" is not an Either type`;
const anError = () => new Error('Something is wrong');
const add1 = (n: number) => n + 1;
const removeFirstElement = <T>(arr: T[]): T[] => {
  if (arr.length === 0) {
    throw new Error('Array is empty');
  }
  return arr.slice(1);
};

describe('Either', () => {
  describe('isRight', () => {
    it('should return false when Left is provided', () => {
      expect(isRight(left(anError()))).to.be.false;
    });
    it('should return true when Right is provided', () => {
      expect(isRight(right('hola'))).to.be.true;
    });
    it('should throw when a non Either type is provided', () => {
      const nonEither: any = [1, 2, 3];
      expect(() => isRight(nonEither)).to.throw(createError(nonEither));
    });
    it('should throw when null or undefined is provided', () => {
      expect(() => isRight(null)).to.throw(createError(null));
      expect(() => isRight(undefined)).to.throw(createError(undefined));
    });
  });

  describe('isLeft', () => {
    it('should return false when Right is provided', () => {
      expect(isLeft(right('hola'))).to.be.false;
    });
    it('should return true when Left is provided', () => {
      expect(isLeft(left(anError()))).to.be.true;
    });
    it('should throw when a non Either type is provided', () => {
      const nonEither: any = [1, 2, 3];
      expect(() => isLeft(nonEither)).to.throw(createError(nonEither));
    });
    it('should throw when null or undefined is provided', () => {
      expect(() => isLeft(null)).to.throw(createError(null));
      expect(() => isLeft(undefined)).to.throw(createError(undefined));
    });
  });

  describe('withDefault', () => {
    it('should return the Right value when Right is provided', () => {
      expect(withDefault(right(6), 0)).to.equal(6);
    });
    it('should return the default value when Left is provided', () => {
      expect(withDefault(left(anError()), 0)).to.equal(0);
    });
    it('should throw when a non Either type is provided', () => {
      const nonEither: any = [1, 2, 3];
      expect(() => withDefault(nonEither, 2)).to.throw(createError(nonEither));
    });
    it('should throw when null or undefined is provided', () => {
      expect(() => withDefault(null, 1)).to.throw(createError(null));
      expect(() => withDefault(undefined, 1)).to.throw(createError(undefined));
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
    it('should throw when mapping over null, undefined or any non Either type', () => {
      expect(() => map(add1, null)).to.throw(createError(null));
      expect(() => map(add1, undefined)).to.throw(createError(undefined));
      expect(() => map(add1, {} as any)).to.throw(
        createError('[object Object]')
      );
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
    it('should throw when chaining over null, undefined or any non Either type', () => {
      expect(() => andThen(a => right(a), null)).to.throw(createError(null));
      expect(() => andThen(a => right(a), undefined)).to.throw(
        createError(undefined)
      );
      expect(() => andThen(a => right(a), {} as any)).to.throw(
        createError('[object Object]')
      );
    });
  });

  describe('caseOf', () => {
    it('should Launch 5 missiles', () => {
      return expect(
        caseOf(
          {
            Left: err => `Error: ${err.message}`,
            Right: n => `Launch ${n} missiles`
          },
          right('5')
        )
      ).to.eventually.equal('Launch 5 missiles');
    });
    it('should error', () => {
      return expect(
        caseOf(
          {
            Left: err => `Error: ${err.message}`,
            Right: n => `Launch ${n} missiles`
          },
          left(anError())
        )
      ).to.be.rejectedWith('Error: Something is wrong');
    });
  });

  describe('examples', () => {
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

    it('should be all right', () => {
      const bandNames = generateExample('bands.json', bandsJsonWithContent);
      return expect(
        caseOf(
          {
            Left: err => err.message,
            Right: names => names
          },
          bandNames
        )
      ).to.eventually.deep.equal(['Clark', 'Plaid']);
    });

    it(`should fail becasue File xyz doesn't exist`, () => {
      const bandNames = generateExample(
        'non-existing.json',
        bandsJsonWithContent
      );
      return expect(
        caseOf(
          {
            Left: err => err.message,
            Right: names => names
          },
          bandNames
        )
      ).to.be.rejectedWith(`File non-existing.json doesn't exist`);
    });

    it(`should fail becasue File content is not valid Json`, () => {
      const bandNames = generateExample('bands.json', bandsJsonWithoutContent);
      return expect(
        caseOf(
          {
            Left: err => err.message,
            Right: names => names
          },
          bandNames
        )
      ).to.be.rejectedWith(`Unexpected end of JSON input`);
    });
  });
});
