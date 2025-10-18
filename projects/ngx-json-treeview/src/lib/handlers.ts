import { ValueClickHandler } from './types';

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
 * A collection of built-in value click handlers.
 * This array can be used to easily apply all default handlers.
 */
export const VALUE_CLICK_HANDLERS: readonly ValueClickHandler[] = [
  followLinkHandler,
];

/**
 * A namespace for individual value click handlers.
 * This allows for easy discovery and individual import of handlers.
 */
export const ValueClickHandlers = {
  followLinkHandler,
};
