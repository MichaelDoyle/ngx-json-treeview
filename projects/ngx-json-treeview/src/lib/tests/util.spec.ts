import { decycle, previewString } from '../util';

describe('Util', () => {
  describe('previewString', () => {
    it('should handle null values', () => {
      expect(previewString(null)).toEqual('null');
    });

    it('should handle undefined values', () => {
      expect(previewString(undefined)).toEqual('undefined');
    });

    it('should handle string values', () => {
      expect(previewString('hello')).toEqual('"hello"');
    });

    it('should handle boolean values', () => {
      expect(previewString(true)).toEqual('true');
    });

    it('should handle number (integer) values', () => {
      expect(previewString(42)).toEqual('42');
    });

    it('should handle number (decimal) values', () => {
      expect(previewString(5.6)).toEqual('5.6');
    });

    it('should handle date objects', () => {
      const date = new Date();
      expect(previewString(date)).toEqual(`"${date.toISOString()}"`);
    });

    it('should handle arrays', () => {
      expect(previewString([1, 2, 3])).toEqual('Array[3] [1,2,3]');
    });

    it('should handle regular objects', () => {
      const obj = { a: 1, b: 'hello' };
      expect(previewString(obj)).toEqual('Object {"a":1,"b":"hello"}');
    });

    it('should handle function values', () => {
      expect(previewString(() => {})).toEqual('Function');
    });

    it('should truncate when limit is exceeded', () => {
      const obj = { a: 1, b: 'hello'.repeat(50) };
      expect(previewString(obj, 20)).toEqual('Object {"a":1,"b":"h…');
    });

    it('should truncate string values in objects when stringsLimit is exceeded', () => {
      const obj = { a: 1, b: 'hello'.repeat(50) };
      expect(previewString(obj, 200, 10)).toEqual(
        'Object {"a":1,"b":"hellohello…"}'
      );
    });

    it('should truncate string values in arrays when stringsLimit is exceeded', () => {
      expect(previewString(['longstring'.repeat(10)], 200, 10)).toEqual(
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
  });
});
