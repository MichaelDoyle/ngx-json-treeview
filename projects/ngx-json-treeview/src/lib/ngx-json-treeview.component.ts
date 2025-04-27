import { CommonModule } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { decycle, previewString } from './util';

export interface Segment {
  key: string;
  value: any;
  type?: string;
  description: string;
  expanded: boolean;
  parent?: Segment;
  path: string;
}

@Component({
  selector: 'ngx-json-treeview',
  imports: [CommonModule],
  templateUrl: './ngx-json-treeview.component.html',
  styleUrls: ['./ngx-json-treeview.component.scss'],
})
export class NgxJsonTreeviewComponent {
  // inputs & outputs
  json = input.required<any>();
  expanded = input<boolean>(true);
  depth = input<number>(-1);
  enableClickableValues = input<boolean>(false);

  _parent = input<Segment>();
  _currentDepth = input<number>(0);

  onValueClick = output<Segment>();

  // computed values
  segments = computed<Segment[]>(() => {
    const json = decycle(this.json());
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

  onValueClickHandler(segment: Segment) {
    if (this.enableClickableValues()) {
      this.onValueClick.emit(segment);
    }
  }

  private parseKeyValue(key: any, value: any): Segment {
    const segment: Segment = {
      parent: this._parent(),
      path: this._parent() ? `${this._parent()!.path}.${key}` : key,
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
          segment.description = previewString(segment.value);
        } else if (segment.value instanceof Date) {
          segment.type = 'date';
          segment.description = `"${segment.value.toISOString()}"`;
        } else {
          segment.type = 'object';
          segment.description = previewString(segment.value);
        }
        break;
      default:
        console.error('Unknown type parsing json key/value.');
    }

    return segment;
  }
}
