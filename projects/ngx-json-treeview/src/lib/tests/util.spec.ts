import { type Segment } from '../types';
import { decycle, isExpandableSegment, previewString } from '../util';

describe('Util', () => {
  describe('previewString', () => {
    it('should handle null values', () => {
      expect(previewString(null)).toBe('null');
    });

    it('should handle undefined values', () => {
      expect(previewString(undefined)).toBe('undefined');
    });

    it('should handle string values', () => {
      expect(previewString('hello')).toBe('"hello"');
    });

    it('should handle boolean values', () => {
      expect(previewString(true)).toBe('true');
    });

    it('should handle number (integer) values', () => {
      expect(previewString(42)).toBe('42');
    });

    it('should handle number (decimal) values', () => {
      expect(previewString(5.6)).toBe('5.6');
    });

    it('should handle date objects', () => {
      const date = new Date();
      expect(previewString(date)).toBe(`"${date.toISOString()}"`);
    });

    it('should handle arrays', () => {
      expect(previewString([1, 2, 3])).toBe('Array[3] [1,2,3]');
    });

    it('should handle regular objects', () => {
      const obj = { a: 1, b: 'hello' };
      expect(previewString(obj)).toBe('Object {"a":1,"b":"hello"}');
    });

    it('should handle function values', () => {
      expect(previewString(() => {})).toBe('Function');
    });

    it('should handle bigint values', () => {
      expect(previewString(123n)).toBe('123n');
    });

    it('should handle negative bigint values', () => {
      expect(previewString(-42n)).toBe('-42n');
    });

    it('should handle symbol values', () => {
      expect(previewString(Symbol('foo'))).toBe('Symbol(foo)');
    });

    it('should handle empty symbol values', () => {
      expect(previewString(Symbol())).toBe('Symbol()');
    });

    it('should handle RegExp values', () => {
      expect(previewString(/abc/gi)).toBe('/abc/gi');
    });

    it('should return ellipsis when limit is <= 0', () => {
      expect(previewString('hello', 0)).toBe('…');
    });

    it('should truncate when limit is exceeded', () => {
      const obj = { a: 1, b: 'hello'.repeat(50) };
      expect(previewString(obj, 20)).toBe('Object {"a":1,"b":"…');
    });

    it('should default limit to 80 characters', () => {
      const obj: Record<string, string> = {};
      for (let i = 0; i < 20; i++) {
        obj[`key_${i}`] = `val_${i}`;
      }
      const preview = previewString(obj);
      expect(preview).toHaveLength(80);
      expect(preview.endsWith('…')).toBe(true);
    });

    it('should truncate string values in objects when stringsLimit is exceeded', () => {
      const obj = { a: 1, b: 'hello'.repeat(50) };
      expect(previewString(obj, 200, 10)).toBe(
        'Object {"a":1,"b":"hellohello…"}'
      );
    });

    it('should truncate string values in arrays when stringsLimit is exceeded', () => {
      expect(previewString(['longstring'.repeat(10)], 200, 10)).toBe(
        'Array[1] ["longstring…"]'
      );
    });

    describe('parity with JSON.stringify()', () => {
      it('should handle null values', () => {
        expect(previewString(null)).toEqual(JSON.stringify(null));
      });

      it('should handle undefined values', () => {
        expect(previewString(undefined)).toEqual(
          JSON.stringify(undefined) + ''
        );
      });

      it('should handle string values', () => {
        expect(previewString('hello')).toEqual(JSON.stringify('hello'));
      });

      it('should handle number (integer) values', () => {
        expect(previewString(42)).toEqual(JSON.stringify(42));
      });

      it('should handle number (decimal) values', () => {
        expect(previewString(5.6)).toEqual(JSON.stringify(5.6));
      });

      it('should handle boolean values', () => {
        expect(previewString(true)).toEqual(JSON.stringify(true));
      });

      it('should handle date objects', () => {
        const date = new Date();
        expect(previewString(date)).toEqual(JSON.stringify(date));
      });

      it('should handle regular objects', () => {
        const obj = { a: 1, b: 'hello' };
        expect(previewString(obj)).toEqual('Object ' + JSON.stringify(obj));
      });

      it('should handle arrays', () => {
        const arr = [1, 2, 'hello'];
        expect(previewString(arr)).toEqual('Array[3] ' + JSON.stringify(arr));
      });

      // functions have intentional differences
    });
  });

  describe('decycle', () => {
    it('should replace circular references with $ref properties', () => {
      const obj = { a: 1 } as any;
      obj.b = obj;
      expect(decycle(obj)).toEqual({ a: 1, b: { $ref: '$' } });
    });

    it('should handle arrays with circular references', () => {
      const arr: any[] = [1];
      arr[1] = arr;
      expect(decycle(arr)).toEqual([1, { $ref: '$' }]);
    });

    it('should handle nested objects with circular references', () => {
      const obj1 = { a: 1 } as any;
      const obj2 = { b: 2, c: obj1 } as any;
      obj1.d = obj2;
      expect(decycle(obj1)).toEqual({ a: 1, d: { b: 2, c: { $ref: '$' } } });
    });

    it('should keep an object shared by sibling branches in each of them', () => {
      const sharedAddress = { city: 'Boston', zip: '02101' };
      const order = {
        billingAddress: sharedAddress,
        shippingAddress: sharedAddress,
      };
      expect(decycle(order)).toEqual({
        billingAddress: { city: 'Boston', zip: '02101' },
        shippingAddress: { city: 'Boston', zip: '02101' },
      });
    });

    it('should keep an array shared by cousin branches in each of them', () => {
      const tags = ['a', 'b'];
      const value = { x: { tags }, y: [{ tags }] };
      expect(decycle(value)).toEqual({
        x: { tags: ['a', 'b'] },
        y: [{ tags: ['a', 'b'] }],
      });
    });

    it('should still replace a cycle through a shared object', () => {
      const shared = { name: 'shared' } as any;
      const root = { first: shared, second: shared } as any;
      shared.back = root;
      expect(decycle(root)).toEqual({
        first: { name: 'shared', back: { $ref: '$' } },
        second: { name: 'shared', back: { $ref: '$' } },
      });
    });
  });

  describe('isExpandableSegment', () => {
    it('should return true for a non-empty object segment', () => {
      const segment: Segment = {
        key: 'a',
        value: { x: 1 },
        type: 'object',
        description: '',
        expanded: false,
        path: 'a',
      };
      expect(isExpandableSegment(segment)).toBe(true);
    });

    it('should return true for a non-empty array segment', () => {
      const segment: Segment = {
        key: 'b',
        value: [1],
        type: 'array',
        description: '',
        expanded: false,
        path: 'b',
      };
      expect(isExpandableSegment(segment)).toBe(true);
    });

    it('should return false for an empty object segment', () => {
      const segment: Segment = {
        key: 'a',
        value: {},
        type: 'object',
        description: '',
        expanded: false,
        path: 'a',
      };
      expect(isExpandableSegment(segment)).toBe(false);
    });

    it('should return false for an empty array segment', () => {
      const segment: Segment = {
        key: 'b',
        value: [],
        type: 'array',
        description: '',
        expanded: false,
        path: 'b',
      };
      expect(isExpandableSegment(segment)).toBe(false);
    });

    it('should return false for a primitive segment', () => {
      const segment: Segment = {
        key: 'c',
        value: 'test',
        type: 'string',
        description: '',
        expanded: false,
        path: 'c',
      };
      expect(isExpandableSegment(segment)).toBe(false);
    });

    it('should return false for null or undefined segment value', () => {
      const nullSegment: Segment = {
        key: 'd',
        value: null,
        type: 'null',
        description: '',
        expanded: false,
        path: 'd',
      };
      expect(isExpandableSegment(nullSegment)).toBe(false);
      expect(isExpandableSegment(null as any)).toBe(false);
    });
  });
});
