/**
 * Generates a preview string representation of an object.
 *
 * @param obj The object to preview.
 * @param limit The maximum length of the preview string. Defaults to 200.
 * @param stringsLimit The maximum length of a string to display before
 * truncating. Defaults to 10.
 * @returns A preview string representation of the object.
 */
export function previewString(obj: any, limit = 200, stringsLimit = 10) {
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
  } else if (typeof obj === 'object') {
    if (obj instanceof Date) {
      result += `"${obj.toISOString()}"`;
    } else if (Array.isArray(obj)) {
      result += `Array[${obj.length}] [`;
      for (const key in obj) {
        if (result.length >= limit) {
          break;
        }
        result += previewString(obj[key], limit - result.length);
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
          result += previewString(obj[key], limit - result.length);
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

  if (result.length >= limit) {
    return result.substring(0, limit) + '…';
  }

  return result;
}

/**
 * Decycles a JavaScript object by replacing circular references with `$ref`
 * properties. This is useful for serializing objects that contain circular
 * references, preventing infinite loops.
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
      } else {
        nu = {};
        Object.keys(value).forEach(function (name) {
          nu[name] = derez(
            value[name],
            path + '[' + JSON.stringify(name) + ']'
          );
        });
      }
      return nu;
    }
    return value;
  })(object, '$');
}
