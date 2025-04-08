import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';

export interface Segment {
  key: string;
  value: any;
  type: undefined | string;
  description: string;
  expanded: boolean;
}

@Component({
  selector: 'ngx-json-treeview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ngx-json-treeview.component.html',
  styleUrls: ['./ngx-json-treeview.component.scss'],
})
export class NgxJsonTreeviewComponent {
  // inputs & outputs
  json = input.required<any>();
  expanded = input<boolean>(true);
  depth = input<number>(-1);
  _currentDepth = input<number>(0);

  // computed values
  segments = computed<Segment[]>(() => {
    const json = this.decycle(this.json());
    const arr = [];
    if (typeof json === 'object') {
      Object.keys(json).forEach((key) => {
        arr.push(this.parseKeyValue(key, json[key]));
      });
    } else {
      arr.push(this.parseKeyValue(`(${typeof json})`, json));
    }
    return arr;
  });
  isExpanded = computed<boolean>(
    () =>
      this.expanded() &&
      !(this.depth() > -1 && this._currentDepth() >= this.depth())
  );

  isExpandable(segment: Segment) {
    return (
      (segment.type === 'object' && Object.keys(segment.value).length > 0) ||
      (segment.type === 'array' && segment.value.length > 0)
    );
  }

  toggle(segment: Segment) {
    if (this.isExpandable(segment)) {
      segment.expanded = !segment.expanded;
    }
  }

  private parseKeyValue(key: any, value: any): Segment {
    const segment: Segment = {
      key: key,
      value: value,
      type: undefined,
      description: '' + value,
      expanded: this.isExpanded(),
    };

    switch (typeof segment.value) {
      case 'number':
        segment.type = 'number';
        break;
      case 'boolean':
        segment.type = 'boolean';
        break;
      case 'function':
        segment.type = 'function';
        break;
      case 'string':
        segment.type = 'string';
        segment.description = '"' + segment.value + '"';
        break;
      case 'undefined':
        segment.type = 'undefined';
        segment.description = 'undefined';
        break;
      case 'object':
        if (segment.value === null) {
          segment.type = 'null';
          segment.description = 'null';
        } else if (Array.isArray(segment.value)) {
          segment.type = 'array';
          const len = segment.value.length;
          segment.description = `Array[${len}] ${JSON.stringify(segment.value)}`;
        } else if (segment.value instanceof Date) {
          segment.type = 'date';
          segment.description = segment.value.toISOString();
        } else {
          segment.type = 'object';
          segment.description = `Object ${JSON.stringify(segment.value)}`;
        }
        break;
      default:
        console.error('Unknown type parsing json key/value.');
    }

    return segment;
  }

  // https://github.com/douglascrockford/JSON-js/blob/master/cycle.js
  private decycle(object: any) {
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
}
