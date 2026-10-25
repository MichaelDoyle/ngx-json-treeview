import { type Segment } from '../types';
import {
  decycle,
  isCollectionSegment,
  isExpandableSegment,
  previewString,
} from '../util';

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

    it('should handle Error values', () => {
      expect(previewString(new Error('something failed'))).toBe(
        'Error: something failed'
      );
    });

    it('should handle Map values', () => {
      const map = new Map<string, any>([
        ['a', 1],
        ['b', 'hello'],
      ]);
      expect(previewString(map)).toBe('Map(2) {"a" => 1,"b" => "hello"}');
    });

    it('should handle empty Map values', () => {
      expect(previewString(new Map())).toBe('Map(0) {}');
    });

    it('should handle Set values', () => {
      const set = new Set([1, 'foo', true]);
      expect(previewString(set)).toBe('Set(3) [1,"foo",true]');
    });

    it('should handle empty Set values', () => {
      expect(previewString(new Set())).toBe('Set(0) []');
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

    it('should preserve Error instances without converting them to empty objects', () => {
      const err = new Error('test error');
      const decycled = decycle({ err });
      expect(decycled.err instanceof Error).toBe(true);
      expect(decycled.err.message).toBe('test error');
      expect(decycled.err.name).toBe('Error');
    });

    it('should handle circular references inside Errors', () => {
      const err = new Error('test cycle');
      (err as unknown as Record<string, unknown>)['self'] = err;
      const decycled = decycle(err);
      expect(decycled instanceof Error).toBe(true);
      expect((decycled as unknown as Record<string, unknown>)['self']).toEqual({
        $ref: '$',
      });
    });

    it('should preserve Map instances without converting them to empty objects', () => {
      const map = new Map([['k', 'v']]);
      const decycled = decycle({ map });
      expect(decycled.map instanceof Map).toBe(true);
      expect(decycled.map.get('k')).toBe('v');
    });

    it('should preserve Set instances without converting them to empty objects', () => {
      const set = new Set([1, 2]);
      const decycled = decycle({ set });
      expect(decycled.set instanceof Set).toBe(true);
      expect(decycled.set.has(1)).toBe(true);
      expect(decycled.set.has(2)).toBe(true);
    });

    it('should handle circular references inside Maps', () => {
      const map = new Map<string, any>();
      map.set('self', map);
      const decycled = decycle(map);
      expect(decycled instanceof Map).toBe(true);
      expect(decycled.get('self')).toEqual({ $ref: '$' });
    });

    it('should handle circular references inside Sets', () => {
      const set = new Set<any>();
      set.add(set);
      const decycled = decycle(set);
      expect(decycled instanceof Set).toBe(true);
      expect(Array.from(decycled)[0]).toEqual({ $ref: '$' });
    });
  });

  describe('isExpandableSegment', () => {
    it.each([
      {
        description: 'a non-empty object',
        expected: true,
        segment: { key: 'a', value: { x: 1 }, type: 'object' } as Segment,
      },
      {
        description: 'an empty object',
        expected: false,
        segment: { key: 'a', value: {}, type: 'object' } as Segment,
      },
      {
        description: 'a non-empty array',
        expected: true,
        segment: { key: 'b', value: [1], type: 'array' } as Segment,
      },
      {
        description: 'an empty array',
        expected: false,
        segment: { key: 'b', value: [], type: 'array' } as Segment,
      },
      {
        description: 'a non-empty map',
        expected: true,
        segment: {
          key: 'm',
          value: new Map([['k', 'v']]),
          type: 'map',
        } as Segment,
      },
      {
        description: 'an empty map',
        expected: false,
        segment: { key: 'm', value: new Map(), type: 'map' } as Segment,
      },
      {
        description: 'a non-empty set',
        expected: true,
        segment: { key: 's', value: new Set([1]), type: 'set' } as Segment,
      },
      {
        description: 'an empty set',
        expected: false,
        segment: { key: 's', value: new Set(), type: 'set' } as Segment,
      },
      {
        description: 'an error',
        expected: true,
        segment: {
          key: 'err',
          value: new Error('something went wrong'),
          type: 'error',
        } as Segment,
      },
      {
        description: 'a primitive string',
        expected: false,
        segment: { key: 'c', value: 'test', type: 'string' } as Segment,
      },
      {
        description: 'a null segment value',
        expected: false,
        segment: { key: 'd', value: null, type: 'null' } as Segment,
      },
      {
        description: 'a null segment',
        expected: false,
        segment: null as any,
      },
      {
        description: 'an undefined segment',
        expected: false,
        segment: undefined as any,
      },
    ])('should return $expected for $description', ({ segment, expected }) => {
      expect(isExpandableSegment(segment)).toBe(expected);
    });
  });

  describe('isCollectionSegment', () => {
    it.each([
      {
        description: 'an expandable object',
        expected: true,
        segment: { key: 'a', value: { x: 1 }, type: 'object' } as Segment,
      },
      {
        description: 'an expandable array',
        expected: true,
        segment: { key: 'b', value: [1], type: 'array' } as Segment,
      },
      {
        description: 'an expandable error',
        expected: true,
        segment: {
          key: 'err',
          value: new Error('something went wrong'),
          type: 'error',
        } as Segment,
      },
      {
        description: 'a non-empty map',
        expected: true,
        segment: {
          key: 'm',
          value: new Map([['k', 'v']]),
          type: 'map',
        } as Segment,
      },
      {
        description: 'an empty map',
        expected: true,
        segment: { key: 'm', value: new Map(), type: 'map' } as Segment,
      },
      {
        description: 'a non-empty set',
        expected: true,
        segment: { key: 's', value: new Set([1]), type: 'set' } as Segment,
      },
      {
        description: 'an empty set',
        expected: true,
        segment: { key: 's', value: new Set(), type: 'set' } as Segment,
      },
      {
        description: 'an empty object',
        expected: false,
        segment: { key: 'a', value: {}, type: 'object' } as Segment,
      },
      {
        description: 'an empty array',
        expected: false,
        segment: { key: 'b', value: [], type: 'array' } as Segment,
      },
      {
        description: 'a string primitive',
        expected: false,
        segment: { key: 'str', value: 'hello', type: 'string' } as Segment,
      },
      {
        description: 'a number primitive',
        expected: false,
        segment: { key: 'num', value: 42, type: 'number' } as Segment,
      },
      {
        description: 'a bigint primitive',
        expected: false,
        segment: { key: 'bi', value: 123n, type: 'bigint' } as Segment,
      },
      {
        description: 'a boolean primitive',
        expected: false,
        segment: { key: 'bool', value: true, type: 'boolean' } as Segment,
      },
      {
        description: 'a symbol primitive',
        expected: false,
        segment: {
          key: 'sym',
          value: Symbol('foo'),
          type: 'symbol',
        } as Segment,
      },
      {
        description: 'a regexp primitive',
        expected: false,
        segment: { key: 're', value: /abc/, type: 'regexp' } as Segment,
      },
      {
        description: 'a null segment value',
        expected: false,
        segment: { key: 'n', value: null, type: 'null' } as Segment,
      },
      {
        description: 'a null segment',
        expected: false,
        segment: null as any,
      },
      {
        description: 'an undefined segment',
        expected: false,
        segment: undefined as any,
      },
    ])('should return $expected for $description', ({ segment, expected }) => {
      expect(isCollectionSegment(segment)).toBe(expected);
    });
  });
});
