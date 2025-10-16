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
