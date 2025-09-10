import { InjectionToken } from '@angular/core';

/**
 * Interface for a service that generates unique IDs.
 * @docs-private
 */
export interface IdGenerator {
  next(): string;
}

/**
 * Default implementation of `IdGenerator` for client-side applications.
 * This implementation is not safe for server-side rendering, as the counter
 * is shared across all requests.
 */
class DefaultIdGenerator implements IdGenerator {
  private nextId = 0;

  next(): string {
    return `ngx-json-treeview-${this.nextId++}`;
  }
}

/**
 * Injection token for the `IdGenerator` service.
 *
 * For server-side rendering, it's crucial to provide this token at a request level
 * to ensure that IDs are unique per request. Failure to do so will result in
 * ID mismatches between the server-rendered HTML and the client-side application,
 * breaking hydration.
 *
 * Example for server-side provider in `server.ts` or equivalent:
 *
 * ```typescript
 * // In your server-side providers:
 * { provide: ID_GENERATOR, useClass: ServerIdGenerator }
 * ```
 */
export const ID_GENERATOR = new InjectionToken<IdGenerator>('ID_GENERATOR', {
  providedIn: 'root',
  factory: () => new DefaultIdGenerator(),
});
