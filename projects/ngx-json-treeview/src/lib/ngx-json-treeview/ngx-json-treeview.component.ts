import { Component, computed, inject, input } from '@angular/core';
import { VALUE_CLICK_HANDLERS } from '../handlers';
import { ID_GENERATOR } from '../services/id-generator';
import { Segment, ValueClickHandler } from '../types';
import { decycle, previewString } from '../util';

/**
 * Renders JSON data in an expandable and collapsible tree structure.
 * Allows users to navigate complex data hierarchies visually.
 */
@Component({
  selector: 'ngx-json-treeview',
  imports: [],
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
   * If `true`, values are clickable when there is a corresponding handler
   * in the `valueClickHandlers` array that can process it.
   *
   * This allows for use cases such as:
   * - Following hyperlinks.
   * - Copying a value to the clipboard.
   * - Triggering custom actions based on the value's content or type.
   * @default false
   */
  enableClickableValues = input<boolean>(false);

  /**
   * An array of handler functions to be executed when a value node is clicked.
   * Only the first handler in the array for which `isClickable` returns `true`
   * will be executed.
   * @default VALUE_CLICK_HANDLERS
   */
  valueClickHandlers = input<ValueClickHandler[]>();

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

  rootType = computed<string>(() => {
    if (this.json() === null) {
      return 'null';
    } else if (Array.isArray(this.json())) {
      return 'array';
    } else return typeof this.json();
  });
  segments = computed<Segment[]>(() => {
    const json = decycle(this.json());
    if (typeof json === 'object' && json != null) {
      return Object.keys(json).map((key) => this.parseKeyValue(key, json[key]));
    }
    return [];
  });
  isExpanded = computed<boolean>(
    () =>
      this.expanded() &&
      !(this.depth() > -1 && this._currentDepth() >= this.depth())
  );
  openingBrace = computed<string>(() => {
    if (this.rootType() === 'array') {
      return '[';
    } else return '{';
  });
  closingBrace = computed<string>(() => {
    if (this.rootType() === 'array') {
      return ']';
    } else return '}';
  });
  asString = computed<string>(() =>
    JSON.stringify(this.json(), null, 2).trim()
  );
  primitiveSegmentClass = computed<string>(() => {
    const type = this.rootType();
    if (['object', 'array'].includes(type)) {
      return 'punctuation';
    }
    return 'segment-type-' + type;
  });
  private primitiveSegment = computed<Segment | null>(() => {
    if (this.segments().length > 0) return null;
    return {
      key: '',
      value: this.json(),
      type: this.rootType(),
      description: this.asString(),
      expanded: false,
      path: this._parent()?.path ?? '',
    };
  });
  isClickablePrimitive = computed<boolean>(() => {
    const segment = this.primitiveSegment();
    return !!segment && this.isClickable(segment);
  });
  isArrayElement = computed<boolean>(() => this.rootType() === 'array');
  private internalValueClickHandlers = computed(
    () => this.valueClickHandlers() ?? [...VALUE_CLICK_HANDLERS]
  );

  private readonly idGenerator = inject(ID_GENERATOR);
  public readonly id = this.idGenerator.next();

  isExpandable(segment: Segment) {
    return (
      (segment.type === 'object' && Object.keys(segment.value).length > 0) ||
      (segment.type === 'array' && segment.value.length > 0)
    );
  }

  isEmpty(segment: Segment) {
    return (
      (segment.type === 'object' && Object.keys(segment.value).length === 0) ||
      (segment.type === 'array' && segment.value.length === 0)
    );
  }

  isClickable(segment: Segment): boolean {
    if (!this.enableClickableValues()) {
      return false;
    }

    return this.internalValueClickHandlers().some((handler) => {
      try {
        return handler.canHandle(segment);
      } catch (e) {
        return false;
      }
    });
  }

  toggle(segment: Segment) {
    if (this.isExpandable(segment)) {
      segment.expanded = !segment.expanded;
    }
  }

  onPrimitiveClick(): void {
    const segment = this.primitiveSegment();
    if (segment) {
      this.onValueClickHandler(segment);
    }
  }

  onValueClickHandler(segment: Segment) {
    for (const handler of this.internalValueClickHandlers()) {
      try {
        if (handler.canHandle(segment)) {
          try {
            handler.handler(segment);
          } catch (e) {
            console.error('Error executing click handler:', e);
          }
          return; // Stop after the first handler is executed.
        }
      } catch (e) {
        // in case of any error, continue to the next handler
      }
    }
  }

  openingBraceForSegment(segment: Segment) {
    if (segment.type === 'array') {
      return '[';
    } else if (segment.type === 'object') {
      return '{';
    }

    return undefined;
  }

  closingBraceForSegment(segment: Segment) {
    if (segment.type === 'array') {
      return ']';
    } else if (segment.type === 'object') {
      return '}';
    }

    return undefined;
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
        segment.description = JSON.stringify(segment.value);
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
