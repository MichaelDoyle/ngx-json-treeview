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

/**
 * A function that determines whether a given segment's value should be
 * clickable.
 * @param segment The segment to evaluate.
 * @returns `true` if the value is clickable, `false` otherwise.
 */
export type IsClickableValueFn = (segment: Segment) => boolean;

/**
 * Represents a handler for value click events, containing both the logic to
 * determine if a value is clickable and the handler function itself.
 *
 * This approach allows for a more modular and self-contained way to define
 * click behaviors. Each handler can specify its own criteria for being active
 * and the action to take, making it easier to manage and extend different
 * click functionalities.
 */
export interface ValueClickHandler {
  /**
   * A function that determines whether this handler should be active for a
   * given segment.
   * @param segment The segment to evaluate.
   * @returns `true` if the handler is applicable, `false` otherwise.
   */
  canHandle: IsClickableValueFn;
  /**
   * The function to execute when a clickable value is clicked.
   * @param segment The segment that was clicked.
   */
  handler: (segment: Segment, event?: MouseEvent) => void;
}
