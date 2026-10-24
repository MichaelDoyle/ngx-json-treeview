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

  private baseObj = {
    string: 'Hello World',
    stringPre: 'Hello\nWorld\n\tAnother line',
    number: 1234567890,
    boolean: true,
    url: 'http://www.google.com',
    null: null,
    undefined: undefined,
    date: new Date(),
    array: ['apple', 'banana', 'cherry', 123, false, { foo: 'bar' }],
    emptyArray: [],
    emptyObject: {},
  };

  protected json = {
    ...structuredClone(this.baseObj),
    nested: {
      ...structuredClone(this.baseObj),
      function: () => {
        return 'foo';
      },
      deeplyNested: {
        ...structuredClone(this.baseObj),
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

  protected stringify(obj: unknown) {
    if (typeof obj === 'function') {
      return '' + obj;
    } else if (typeof obj === 'string') {
      return obj;
    }
    return JSON.stringify(obj, null, 2);
  }

  protected toggleExpansion() {
    this.expansionDepth.update((depth) => (depth === -1 ? 0 : -1));
  }
}
