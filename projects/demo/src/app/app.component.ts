import { Component, signal } from '@angular/core';
import { NgxJsonTreeviewComponent, Segment } from 'ngx-json-treeview';

@Component({
  selector: 'app-root',
  imports: [NgxJsonTreeviewComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  currentSegment = signal<Segment | undefined>(undefined);

  baseObj = {
    string: 'Hello World',
    number: 1234567890,
    boolean: true,
    url: 'http://www.google.com',
    null: null,
    undefined: undefined,
    date: new Date(),
    array: ['apple', 'banana', 'cherry', 123, false],
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

  isClickableValue(segment: Segment) {
    return ['object', 'array', 'string'].includes(segment.type ?? '');
  }

  onValueClick(segment: Segment) {
    this.currentSegment.set(segment);
  }

  stringify(obj: any) {
    return typeof obj === 'function' ? '' + obj : JSON.stringify(obj, null, 2);
  }
}
