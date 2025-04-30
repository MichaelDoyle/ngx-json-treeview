import { CommonModule } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { decycle, previewString } from './util';

/**
 * Represents a segment (node) within the JSON tree structure.
 * Each segment corresponds to a key-value pair in an object, an item in an
 * array, or the root value itself, providing context and state for rendering.
 */
export interface Segment {
  /** The key (for objects) or index (for arrays). */
  key: string;
  /** The actual JavaScript value represented by this segment. */
  value: any;
  /** The JavaScript data type of the value. */
  type?: string;
  /** A string representation of the value, used for display purposes. */
  description: string;
  /** Indicates whether the segment is expanded in the UI. */
  expanded: boolean;
  /** A reference to the parent segment in the JSON tree. Undefined for root. */
  parent?: Segment;
  /**
   * A dot/bracket notation path string to this specific segment
   * (e.g., 'settings.notifications.email', 'items[1].value').
   */
  path: string;
}

export type IsClickableValueFn = (segment: Segment) => boolean;

/**
 * Renders JSON data in an expandable and collapsible tree structure.
 * Allows users to navigate complex data hierarchies visually.
 */
@Component({
  selector: 'ngx-json-treeview',
  imports: [CommonModule],
  templateUrl: './ngx-json-treeview.component.html',
  styleUrls: ['./ngx-json-treeview.component.scss'],
})
export class NgxJsonTreeviewComponent {
  /**
   * The JSON object or array to display in the tree view.
   * @required
   */
  json = input.required<any>();

  /**
   * Controls the default expansion state for all expandable segments
   * i.e. objects and arrays.
   * - If `true`, nodes are expanded down to the specified `depth`.
   * - If `false`, all nodes start collapsed.
   * @default true
   */
  expanded = input<boolean>(true);

  /**
   * Determines the maximum nesting level automatically expanded when `expanded`
   * is `true`.
   * - `-1`: Infinite depth (all levels expanded).
   * - `0`: Only the root node is expanded (if applicable).
   * - `n`: Root and nodes down to `n` levels are expanded.
   * @default -1
   */
  depth = input<number>(-1);

  /**
   * If `true`, value nodes will emit an `onValueClick` event when clicked. This
   * allows for some interesting use cases, such as:
   * - Rendering preformatted text, html, markdown, etc in another component.
   * - Copying a value to the clipboard.
   * - Following hyperlinks, etc
   * @default false
   */
  enableClickableValues = input<boolean>(false);

  /**
   * A function that determines if a specific value node should be considered
   * clickable. This provides more granular control than the global
   * `enableClickableValues` flag.
   *
   * The function receives the `Segment` object and should return `true` if the
   * value is clickable, `false` otherwise. This check is only performed if
   * `enableClickableValues` is also `true`.
   *
   * @param segment - The segment being evaluated.
   * @returns `true` if the segment's value should be clickable, `false`
   * otherwise.
   * @default () => true - By default, all values are considered clickable if
   *   `enableClickableValues` is true.
   */
  isClickableValue = input<IsClickableValueFn>(() => true);

  /**
   * If `enableClickableValues` is set to `true`, emits a `Segment` object when
   * a value node is clicked. The emitted `Segment` contains details about the
   * clicked node (key, value, type, path, etc.).
   */
  onValueClick = output<Segment>();

  /**
   * *Internal* input representing the parent segment in the tree hierarchy.
   * Primrily used for calculating paths.
   * @internal
   */
  _parent = input<Segment>();

  /**
   * *Internal* input representing the current nesting depth. Used in
   * conjunction with the `depth` input to control expansion.
   * @internal
   */
  _currentDepth = input<number>(0);

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
      console.debug(`onValueClick: ${segment.path}`);
    }
  }

  private getPath(key: string): string {
    const parent = this._parent();
    let path: string;

    if (parent) {
      if (parent.type === 'array') {
        path = `${parent.path}[${key}]`;
      } else {
        path = `${parent.path}.${key}`;
      }
    } else {
      path = key;
    }

    return path;
  }

  private parseKeyValue(key: any, value: any): Segment {
    const segment: Segment = {
      parent: this._parent(),
      path: this.getPath(key),
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
