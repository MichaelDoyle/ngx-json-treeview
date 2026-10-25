/* eslint-disable @typescript-eslint/no-explicit-any */
import { type Segment } from './types';

/**
 * Generates a preview string representation of an object.
 *
 * @param obj The object to preview.
 * @param limit The maximum length of the preview string. Defaults to 80.
 * @param stringsLimit The maximum length of a string to display before
 * truncating. Defaults to 10.
 * @returns A preview string representation of the object.
 */
export function previewString(obj: any, limit = 80, stringsLimit = 10) {
  if (limit <= 0) {
    return '…';
  }

  let result = '';

  if (obj === null) {
    result += 'null';
  } else if (obj === undefined) {
    result += 'undefined';
  } else if (typeof obj === 'string') {
    if (obj.length > stringsLimit) {
      result += `"${obj.substring(0, stringsLimit)}…"`;
    } else {
      result += `"${obj}"`;
    }
  } else if (typeof obj === 'boolean') {
    result += `${obj ? 'true' : 'false'}`;
  } else if (typeof obj === 'number') {
    result += `${obj}`;
  } else if (typeof obj === 'bigint') {
    result += `${obj}n`;
  } else if (typeof obj === 'symbol') {
    result += obj.toString();
  } else if (typeof obj === 'object') {
    if (obj instanceof Date) {
      result += `"${obj.toISOString()}"`;
    } else if (obj instanceof RegExp) {
      result += obj.toString();
    } else if (obj instanceof Error) {
      result += obj.toString();
    } else if (obj instanceof Map) {
      result += `Map(${obj.size}) {`;
      for (const [k, v] of obj.entries()) {
        if (result.length >= limit) {
          break;
        }
        result += previewString(k, limit - result.length, stringsLimit);
        result += ' => ';
        result += previewString(v, limit - result.length, stringsLimit);
        result += ',';
      }
      if (result.endsWith(',')) {
        result = result.slice(0, -1);
      }
      result += '}';
    } else if (obj instanceof Set) {
      result += `Set(${obj.size}) [`;
      for (const item of obj.values()) {
        if (result.length >= limit) {
          break;
        }
        result += previewString(item, limit - result.length, stringsLimit);
        result += ',';
      }
      if (result.endsWith(',')) {
        result = result.slice(0, -1);
      }
      result += ']';
    } else if (Array.isArray(obj)) {
      result += `Array[${obj.length}] [`;
      for (const key in obj) {
        if (result.length >= limit) {
          break;
        }
        result += previewString(obj[key], limit - result.length, stringsLimit);
        result += ',';
      }
      if (result.endsWith(',')) {
        result = result.slice(0, -1);
      }
      result += ']';
    } else {
      result += 'Object {';
      for (const key in obj) {
        if (result.length >= limit) {
          break;
        }
        if (obj[key] !== undefined) {
          result += `"${key}":`;
          result += previewString(
            obj[key],
            limit - result.length,
            stringsLimit
          );
          result += ',';
        }
      }
      if (result.endsWith(',')) {
        result = result.slice(0, -1);
      }
      result += '}';
    }
  } else if (typeof obj === 'function') {
    result += 'Function';
  }

  if (result.length > limit) {
    return result.substring(0, Math.max(0, limit - 1)) + '…';
  }

  return result;
}

/**
 * Decycles a JavaScript object by replacing circular references with `$ref`
 * properties. This is useful for serializing objects that contain circular
 * references, preventing infinite loops. Only a reference back to an ancestor
 * is replaced: an object that appears in several branches (a shared, not
 * circular, reference) is kept in each of them.
 *
 * Original: https://github.com/douglascrockford/JSON-js/blob/master/cycle.js
 *
 * @param object The object to decycle.
 * @returns A decycled version of the object.
 */
export function decycle(object: any): any {
  const objects = new WeakMap();
  return (function derez(value, path) {
    let old_path;
    let nu: any;

    if (
      typeof value === 'object' &&
      value !== null &&
      !(value instanceof Boolean) &&
      !(value instanceof Date) &&
      !(value instanceof Number) &&
      !(value instanceof RegExp) &&
      !(value instanceof String)
    ) {
      old_path = objects.get(value);
      if (old_path !== undefined) {
        return { $ref: old_path };
      }
      objects.set(value, path);

      if (Array.isArray(value)) {
        nu = [];
        value.forEach(function (element, i) {
          nu[i] = derez(element, path + '[' + i + ']');
        });
      } else if (value instanceof Map) {
        nu = new Map();
        value.forEach(function (val, key) {
          nu.set(
            key,
            derez(val, path + '[' + JSON.stringify(String(key)) + ']')
          );
        });
      } else if (value instanceof Set) {
        nu = new Set();
        let i = 0;
        value.forEach(function (val) {
          nu.add(derez(val, path + '[' + i + ']'));
          i++;
        });
      } else if (value instanceof Error) {
        nu = Object.create(Object.getPrototypeOf(value));
        nu.name = derez(value.name, path + '["name"]');
        nu.message = derez(value.message, path + '["message"]');
        if (value.stack !== undefined) {
          nu.stack = derez(value.stack, path + '["stack"]');
        }
        Object.keys(value).forEach(function (name) {
          if (name !== 'name' && name !== 'message' && name !== 'stack') {
            nu[name] = derez(
              (value as unknown as Record<string, unknown>)[name],
              path + '[' + JSON.stringify(name) + ']'
            );
          }
        });
      } else {
        nu = {};
        Object.keys(value).forEach(function (name) {
          nu[name] = derez(
            value[name],
            path + '[' + JSON.stringify(name) + ']'
          );
        });
      }
      // Leaving this branch: from here on, the object is no longer an ancestor.
      objects.delete(value);
      return nu;
    }
    return value;
  })(object, '$');
}

/**
 * Determines whether a segment represents an expandable node
 * (i.e. a non-empty object, array, map, or set).
 *
 * @param segment The segment to evaluate.
 * @returns `true` if the segment is expandable, `false` otherwise.
 */
export function isExpandableSegment(segment: Segment): boolean {
  if (!segment?.value) {
    return false;
  }

  return (
    (segment.type === 'object' && Object.keys(segment.value).length > 0) ||
    (segment.type === 'array' && segment.value.length > 0) ||
    (segment.type === 'map' && segment.value.size > 0) ||
    (segment.type === 'set' && segment.value.size > 0) ||
    segment.type === 'error'
  );
}

/**
 * Determines whether a segment represents a collection or container description
 * that should receive label styling (e.g. expandable containers, empty Maps, and empty Sets).
 *
 * @param segment The segment to evaluate.
 * @returns `true` if the segment represents a collection/container, `false` otherwise.
 */
export function isCollectionSegment(segment: Segment): boolean {
  return (
    isExpandableSegment(segment) ||
    segment?.type === 'map' ||
    segment?.type === 'set'
  );
}
