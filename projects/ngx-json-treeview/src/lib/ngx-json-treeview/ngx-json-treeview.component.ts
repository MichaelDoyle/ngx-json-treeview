import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { StopClickPropagationDirective } from '../directives/stop-click-propagation.directive';
import { VALUE_CLICK_HANDLERS } from '../handlers';
import { ID_GENERATOR } from '../services/id-generator';
import { IsClickableValueFn, Segment, ValueClickHandler } from '../types';
import { decycle, previewString } from '../util';

/**
 * Renders JSON data in an expandable and collapsible tree structure.
 * Allows users to navigate complex data hierarchies visually.
 */
@Component({
  selector: 'ngx-json-treeview',
  imports: [StopClickPropagationDirective],
  templateUrl: './ngx-json-treeview.component.html',
  styleUrls: ['./ngx-json-treeview.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgxJsonTreeviewComponent {
  /**
   * The JSON object or array to display in the tree view.
   * @required
   */
  readonly json = input.required<any>();

  /**
   * Controls the default expansion state for all expandable segments
   * i.e. objects and arrays.
   * - If `true`, nodes are expanded down to the specified `depth`.
   * - If `false`, all nodes start collapsed.
   * @default true
   */
  readonly expanded = input<boolean>(true);

  /**
   * Determines the maximum nesting level automatically expanded when `expanded`
   * is `true`.
   * - `-1`: Infinite depth (all levels expanded).
   * - `0`: Only the root node is expanded (if applicable).
   * - `n`: Root and nodes down to `n` levels are expanded.
   * @default -1
   */
  readonly depth = input<number>(-1);

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
  readonly enableClickableValues = input<boolean>(false);

  /**
   * A flag to control whether click events on nodes propagate up the DOM tree.
   *
   * By default, click events are stopped from propagating. This is useful when
   * the tree view is embedded within other clickable elements to avoid
   * unintended side effects.
   *
   * Set to `false` to allow events to propagate.
   *
   * @default true
   */
  readonly stopClickPropagation = input<boolean>(true);

  /**
   * @deprecated Use `valueClickHandlers` instead. This input will be removed
   * in a future version.
   *
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
   */
  readonly isClickableValue = input<IsClickableValueFn>();

  /**
   * @deprecated Use `valueClickHandlers` instead. This output will be removed
   * in a future version.
   *
   * If `enableClickableValues` is set to `true`, emits a `Segment` object when
   * a value node is clicked. The emitted `Segment` contains details about the
   * clicked node (key, value, type, path, etc.).
   */
  readonly onValueClick = output<Segment>();

  /**
   * An array of handler functions to be executed when a value node is clicked.
   * Only the first handler in the array for which `isClickable` returns `true`
   * will be executed.
   *
   * If `enableClickableValues` is set to true, but `valueClickHandlers` is
   * omitted, the built-in `VALUE_CLICK_HANDLERS` will be used as the default.
   */
  readonly valueClickHandlers = input<ValueClickHandler[]>();

  /**
   * *Internal* input representing the parent segment in the tree hierarchy.
   * Primrily used for calculating paths.
   * @internal
   */
  protected readonly _parent = input<Segment>();

  /**
   * *Internal* input representing the current nesting depth. Used in
   * conjunction with the `depth` input to control expansion.
   * @internal
   */
  protected readonly _currentDepth = input<number>(0);

  private internalValueClickHandlers = computed<ValueClickHandler[]>(() => {
    const handlers: ValueClickHandler[] = [];
    const legacyIsClickableFn = this.isClickableValue();

    if (legacyIsClickableFn) {
      handlers.push({
        canHandle: legacyIsClickableFn,
        handler: (segment) => this.onValueClick.emit(segment),
      });
    }

    handlers.push(...(this.valueClickHandlers() ?? VALUE_CLICK_HANDLERS));
    return handlers;
  });

  private readonly rootType = computed<string>(() => {
    if (this.json() === null) {
      return 'null';
    } else if (Array.isArray(this.json())) {
      return 'array';
    } else return typeof this.json();
  });

  protected readonly segments = computed<Segment[]>(() => {
    const json = decycle(this.json());
    if (typeof json === 'object' && json != null) {
      return Object.keys(json).map((key) => this.parseKeyValue(key, json[key]));
    }
    return [];
  });

  private readonly isExpanded = computed<boolean>(
    () =>
      this.expanded() &&
      !(this.depth() > -1 && this._currentDepth() >= this.depth())
  );

  protected readonly openingBrace = computed<string>(() => {
    if (this.rootType() === 'array') {
      return '[';
    } else return '{';
  });

  protected readonly closingBrace = computed<string>(() => {
    if (this.rootType() === 'array') {
      return ']';
    } else return '}';
  });

  protected readonly asString = computed<string>(() =>
    JSON.stringify(this.json(), null, 2).trim()
  );

  protected readonly primitiveSegmentClass = computed<string>(() => {
    const type = this.rootType();
    if (['object', 'array'].includes(type)) {
      return 'punctuation';
    }
    return 'segment-type-' + type;
  });

  private readonly primitiveSegment = computed<Segment | null>(() => {
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

  protected readonly isClickablePrimitive = computed<boolean>(() => {
    const segment = this.primitiveSegment();
    return !!segment && this.isClickable(segment);
  });

  protected readonly isArrayElement = computed<boolean>(
    () => this.rootType() === 'array'
  );

  /**
   * Tracks the expansion state of individual segments. Ensures user-toggled
   * states persist even when the underlying data or segments are re-generated.
   */
  private readonly expandedSegments = signal<Map<string, boolean>>(new Map());

  private readonly idGenerator = inject(ID_GENERATOR);
  protected readonly id = this.idGenerator.next();

  constructor() {
    effect(() => {
      this.depth();
      this.expandedSegments.set(new Map());
    });
  }

  protected isExpandable(segment: Segment) {
    return (
      (segment.type === 'object' && Object.keys(segment.value).length > 0) ||
      (segment.type === 'array' && segment.value.length > 0)
    );
  }

  protected isEmpty(segment: Segment) {
    return (
      (segment.type === 'object' && Object.keys(segment.value).length === 0) ||
      (segment.type === 'array' && segment.value.length === 0)
    );
  }

  protected isClickable(segment: Segment): boolean {
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

  protected toggle(segment: Segment) {
    if (this.isExpandable(segment)) {
      this.expandedSegments.update((map) => {
        const newMap = new Map(map);
        newMap.set(segment.path, !segment.expanded);
        return newMap;
      });
    }
  }

  protected onPrimitiveClick(event?: MouseEvent): void {
    const segment = this.primitiveSegment();
    if (segment) {
      this.onValueClickHandler(segment, event);
    }
  }

  protected onValueClickHandler(segment: Segment, event?: MouseEvent) {
    for (const handler of this.internalValueClickHandlers()) {
      try {
        if (handler.canHandle(segment)) {
          try {
            handler.handler(segment, event);
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

  protected openingBraceForSegment(segment: Segment) {
    if (segment.type === 'array') {
      return '[';
    } else if (segment.type === 'object') {
      return '{';
    }

    return undefined;
  }

  protected closingBraceForSegment(segment: Segment) {
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
    const path = this.getPath(key);
    const segment: Segment = {
      parent: this._parent(),
      path,
      key: key,
      value: value,
      type: undefined,
      description: '' + value,
      expanded: this.expandedSegments().get(path) ?? this.isExpanded(),
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
