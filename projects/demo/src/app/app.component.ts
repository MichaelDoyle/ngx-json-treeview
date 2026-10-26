import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  NgxJsonTreeviewComponent,
  type Segment,
  VALUE_CLICK_HANDLERS,
  type ValueClickHandler,
} from 'ngx-json-treeview';
import { ThemeService } from './services/theme.service';

function createBaseObj() {
  const sampleError = new Error('Failed to fetch resource', {
    cause: new Error('Network timeout'),
  });
  (sampleError as unknown as Record<string, unknown>)['code'] = 'ERR_NETWORK';
  (sampleError as unknown as Record<string, unknown>)['statusCode'] = 503;

  return {
    string: 'Hello World',
    stringPre: 'Hello\nWorld\n\tAnother line',
    number: 1234567890,
    bigint: 9007199254740993n,
    symbol: Symbol('demoSymbol'),
    boolean: true,
    url: 'http://www.google.com',
    null: null,
    undefined: undefined,
    date: new Date(),
    regexp: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/g,
    error: sampleError,
    map: new Map<string, string | number>([
      ['key1', 'value1'],
      ['key2', 42],
    ]),
    emptyMap: new Map(),
    set: new Set(['apple', 'banana', 'cherry']),
    emptySet: new Set(),
    array: ['apple', 'banana', 'cherry', 123, false, { foo: 'bar' }],
    emptyArray: [],
    emptyObject: {},
  };
}

@Component({
  selector: 'app-root',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTabsModule,
    MatToolbarModule,
    MatTooltipModule,
    NgxJsonTreeviewComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  protected readonly themeService = inject(ThemeService);

  protected readonly currentSegment = signal<Segment | undefined>(undefined);
  protected readonly expansionDepth = signal(1);

  protected json = {
    ...createBaseObj(),
    nested: {
      ...createBaseObj(),
      function: () => {
        return 'foo';
      },
      deeplyNested: {
        ...createBaseObj(),
        function: () => {
          return 'bar';
        },
      },
    },
    function: () => {
      return 'baz';
    },
  };

  protected clickHandlers: ValueClickHandler[] = [
    ...VALUE_CLICK_HANDLERS,
    {
      canHandle: () => true,
      handler: (segment: Segment) => {
        this.currentSegment.set(segment);
      },
    },
  ];

  protected stringify(value: unknown): string {
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'function' || typeof value === 'symbol') {
      return value.toString();
    }
    if (typeof value === 'bigint') {
      return `${value}n`;
    }
    if (value === undefined) {
      return 'undefined';
    }
    try {
      return JSON.stringify(
        value,
        (_key, val) => {
          if (typeof val === 'bigint') {
            return `${val}n`;
          }
          if (
            typeof val === 'symbol' ||
            typeof val === 'function' ||
            val instanceof RegExp
          ) {
            return val.toString();
          }
          if (val instanceof Map) {
            return Object.fromEntries(val);
          }
          if (val instanceof Set) {
            return Array.from(val);
          }
          if (val instanceof Error) {
            return {
              ...val,
              name: val.name,
              message: val.message,
              ...('cause' in val && val.cause !== undefined
                ? { cause: val.cause }
                : {}),
              ...(val.stack !== undefined ? { stack: val.stack } : {}),
            };
          }
          return val;
        },
        2
      );
    } catch {
      return String(value);
    }
  }

  protected toggleExpansion() {
    this.expansionDepth.update((depth) => (depth === -1 ? 0 : -1));
  }
}
