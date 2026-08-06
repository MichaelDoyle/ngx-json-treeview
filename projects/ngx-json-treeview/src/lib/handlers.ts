import { ValueClickHandler } from './types';
import { isExpandableSegment } from './util';

/**
 * A handler that checks if a segment's value is a string that looks like an
 * HTTP/HTTPS link. If it is, it opens the link in a new tab.
 */
export const followLinkHandler: ValueClickHandler = {
  canHandle: (segment) => {
    if (typeof segment.value === 'string' && segment.value.startsWith('http')) {
      try {
        const url = new URL(segment.value); // Validate the URL.
        return url.protocol === 'http:' || url.protocol === 'https:';
      } catch (e) {
        // Invalid URL.
      }
    }
    return false;
  },
  handler: (segment) => {
    window.open(segment.value, '_blank', 'noopener,noreferrer');
  },
};

/**
 * A handler that checks if a segment's value is an expandable object or array.
 * If clicked, it expands or toggles the node in the tree view component.
 */
export const expandHandler: ValueClickHandler = {
  canHandle: isExpandableSegment,
  handler: (segment, _, component) => {
    component?.toggle(segment);
  },
};

/**
 * A collection of built-in value click handlers.
 * This array can be used to easily apply all default handlers.
 */
export const VALUE_CLICK_HANDLERS: readonly ValueClickHandler[] = [
  followLinkHandler,
  expandHandler,
];

/**
 * A namespace for individual value click handlers.
 * This allows for easy discovery and individual import of handlers.
 */
export const ValueClickHandlers = {
  followLinkHandler,
  expandHandler,
};
