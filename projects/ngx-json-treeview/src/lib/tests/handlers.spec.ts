import { describe, expect, it, vi } from 'vitest';
import { expandHandler } from '../handlers';
import { Segment } from '../types';

describe('ValueClickHandlers', () => {
  describe('expandHandler', () => {
    it('canHandle should return true for a non-empty object segment', () => {
      const objSegment: Segment = {
        key: 'user',
        value: { name: 'Alice' },
        type: 'object',
        description: 'Object { ... }',
        expanded: false,
        path: 'user',
      };
      expect(expandHandler.canHandle(objSegment)).toBe(true);
    });

    it('canHandle should return true for a non-empty array segment', () => {
      const arrSegment: Segment = {
        key: 'items',
        value: [1, 2, 3],
        type: 'array',
        description: 'Array[3] [ ... ]',
        expanded: false,
        path: 'items',
      };
      expect(expandHandler.canHandle(arrSegment)).toBe(true);
    });

    it('canHandle should return false for an empty object segment', () => {
      const emptyObjSegment: Segment = {
        key: 'empty',
        value: {},
        type: 'object',
        description: '{}',
        expanded: false,
        path: 'empty',
      };
      expect(expandHandler.canHandle(emptyObjSegment)).toBe(false);
    });

    it('canHandle should return false for an empty array segment', () => {
      const emptyArrSegment: Segment = {
        key: 'emptyList',
        value: [],
        type: 'array',
        description: '[]',
        expanded: false,
        path: 'emptyList',
      };
      expect(expandHandler.canHandle(emptyArrSegment)).toBe(false);
    });

    it('canHandle should return false for a string primitive segment', () => {
      const stringSegment: Segment = {
        key: 'name',
        value: 'Alice',
        type: 'string',
        description: '"Alice"',
        expanded: false,
        path: 'name',
      };
      expect(expandHandler.canHandle(stringSegment)).toBe(false);
    });

    it('canHandle should return false for a null segment', () => {
      const nullSegment: Segment = {
        key: 'data',
        value: null,
        type: 'null',
        description: 'null',
        expanded: false,
        path: 'data',
      };
      expect(expandHandler.canHandle(nullSegment)).toBe(false);
    });

    it('handler should invoke toggle on the passed component', () => {
      const segment: Segment = {
        key: 'user',
        value: { name: 'Alice' },
        type: 'object',
        description: 'Object { ... }',
        expanded: false,
        path: 'user',
      };

      const mockComponent = {
        toggle: vi.fn(),
      };

      const mockEvent = new MouseEvent('click');
      expandHandler.handler(segment, mockEvent, mockComponent as any);
      expect(mockComponent.toggle).toHaveBeenCalledWith(segment);
    });

    it('handler should not throw when component is undefined', () => {
      const segment: Segment = {
        key: 'user',
        value: { name: 'Alice' },
        type: 'object',
        description: 'Object { ... }',
        expanded: false,
        path: 'user',
      };

      expect(() =>
        expandHandler.handler(segment, undefined, undefined)
      ).not.toThrow();
    });
  });
});
