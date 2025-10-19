import { Component, signal } from '@angular/core';
import {
  NgxJsonTreeviewComponent,
  Segment,
  ValueClickHandler,
} from 'ngx-json-treeview';

@Component({
  selector: 'app-root',
  imports: [NgxJsonTreeviewComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  currentSegment = signal<Segment | undefined>(undefined);

  primitives = [13, 'hello, world!', true, null, {}, []];

  baseObj = {
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

  json = {
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

  clickHandlers: ValueClickHandler[] = [
    {
      canHandle: (segment: Segment) => {
        return ['object', 'array', 'string'].includes(segment.type ?? '');
      },
      handler: (segment: Segment) => {
        this.currentSegment.set(segment);
      },
    },
  ];

  primitiveClickHandlers: ValueClickHandler[] = [
    {
      canHandle: (segment: Segment) => {
        return ['string'].includes(segment.type ?? '');
      },
      handler: (segment: Segment) => {
        this.currentSegment.set(segment);
      },
    },
  ];

  stringify(obj: any) {
    if (typeof obj === 'function') {
      return '' + obj;
    } else if (typeof obj === 'string') {
      return obj;
    }
    return JSON.stringify(obj, null, 2);
  }
}
