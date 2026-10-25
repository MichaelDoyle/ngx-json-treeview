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
    map: new Map<string, string | number>([
      ['key1', 'value1'],
      ['key2', 42],
    ]),
    emptyMap: new Map(),
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
      canHandle: (segment: Segment) => {
        return ['object', 'array', 'string'].includes(segment.type ?? '');
      },
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
