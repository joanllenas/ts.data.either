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

import * as mocha from 'mocha';
import * as chai from 'chai';

const expect = chai.expect;

const createError = (value: any) => `Value "${value}" is not an Either type`;
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
      expect(isRight(left(''))).to.be.false;
    });
    it('should return true when Right is provided', () => {
      expect(isRight(right('hola'))).to.be.true;
    });
    it('should throw when a non Either type is provided', () => {
      expect(() => isRight([1, 2, 3] as any)).to.throw(createError([1, 2, 3]));
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
      expect(isLeft(left('hola'))).to.be.true;
    });
    it('should throw when a non Either type is provided', () => {
      expect(() => isLeft('lala' as any)).to.throw(createError('lala'));
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
      expect(withDefault(left('err'), 0)).to.equal(0);
    });
    it('should throw when a non Either type is provided', () => {
      expect(() => withDefault('hola' as any, 2)).to.throw(createError('hola'));
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
      const result = map(add1, left('err'));
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
      expect(withDefault(list, ['default', 'val'])).to.eql(['default', 'val']);
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
    const removeFirstLifted = <T, E>(arr: T[]): Either<T[], E> => {
      try {
        return right(removeFirstElement(arr));
      } catch (error) {
        return left(error);
      }
    };
    it('should perform chained Right transformations', () => {
      const result = andThen(
        arr => removeFirstLifted(arr),
        removeFirstLifted(['a', 'b', 'c'])
      );
      expect(withDefault(result, ['default val'])).to.eql(['c']);
    });
    it('should perform chained Right transformations and fail with Left', () => {
      const result = andThen(
        arr => andThen(arr2 => removeFirstLifted(arr2), removeFirstLifted(arr)),
        removeFirstLifted(['a', 'b'])
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
      const result = caseOf(
        {
          Left: err => `Error: ${err}`,
          Right: n => `Launch ${n} missiles`
        },
        right('5')
      );
      expect(result).to.equal('Launch 5 missiles');
    });
    it('should zzz', () => {
      const result = caseOf(
        {
          Left: () => 'zzz',
          Right: n => `Launch ${n} missiles`
        },
        left('zzz')
      );
      expect(result).to.equal('zzz');
    });
  });

  describe('examples', () => {
    it('should work ', () => {
      const head = (arr: number[]): number => {
        if (arr.length === 0) {
          throw new Error('Array is empty');
        }
        return arr.slice(0, 1)[0];
      };
      const num = map(head, right([99, 109, 22, 65]));
      expect(withDefault(map(add1, num), 0)).to.equal(100);
      expect(withDefault(andThen(n => right(add1(n)), num), 0)).to.equal(100);
    });
  });
});
