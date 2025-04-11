import { Component } from '@angular/core';
import { NgxJsonTreeviewComponent } from 'ngx-json-treeview';

@Component({
  selector: 'app-root',
  imports: [NgxJsonTreeviewComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
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
      deeplyNested: {
        ...structuredClone(this.baseObj),
      },
    },
    function: () => {
      return 'foo';
    },
  };
}
