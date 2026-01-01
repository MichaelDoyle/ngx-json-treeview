[![npm version](https://badge.fury.io/js/ngx-json-treeview.svg?icon=si%3Anpm)](https://badge.fury.io/js/ngx-json-treeview) [![CI](https://github.com/michaeldoyle/ngx-json-treeview/actions/workflows/ci.yml/badge.svg)](https://github.com/michaeldoyle/ngx-json-treeview/actions) [![Apache license](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)

# ngx-json-treeview

A simple Angular component to display object data in an expandable JSON tree view.

<img width="751" alt="image" src="https://github.com/user-attachments/assets/6025f020-727e-4098-bcb9-146fb2b66c0a" />

See it in action on StackBlitz.

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/MichaelDoyle/ngx-json-treeview?file=README.md&startScript=start:demo)

## Key Features

- Display JSON objects and arrays in a collapsible tree structure.
- Customize styling with CSS variables.
- Clickable value nodes for custom interactions.
- Control over initial expansion depth.
- Keyboard navigable

## Install

```bash
npm install ngx-json-treeview
```

## Usage

### Basic Setup

By default, JSON objects are rendered fully expanded:

```html
<ngx-json-treeview [json]="someObject" />
```

### Controlling Field Expansion

To render the JSON with all nodes initially collapsed:

```html
<ngx-json-treeview [json]="someObject" [expanded]="false" />
```

Or with nodes expanded up to a certain depth:

```html
<ngx-json-treeview [json]="someObject" [depth]="1" />
```

### Clickable Values

You can make values in the JSON tree clickable to trigger custom actions. For
convenience, a default click handler is provided for URLs (which will be opened
in a new tab, when clicked.)

1.  **Enable Clickable Values**: Set the `enableClickableValues` input to
    `true`. This also enables the default click handler(s) automatically.

    ```html
    <ngx-json-treeview [json]="someObject" [enableClickableValues]="true" />
    ```

2.  **Provide Click Handlers**: Provide your own custom behaviors by passing an
    array of `ValueClickHandler` objects to the
    `valueClickHandlers` input.

    A `ValueClickHandler` has two properties:
    - `canHandle`: A function that returns `true` if the handler should apply to
      a given value.
    - `handler`: The function to execute when the value is clicked.

    Only the _first_ handler in the array where `canHandle` returns `true` will
    be executed.

#### Example: Copy to Clipboard

Here's how you could implement a handler that copies a string value to the
clipboard when clicked.

**In your component's TypeScript file:**

```typescript
import { Segment, ValueClickHandler } from 'ngx-json-treeview';

// Define a custom click handler
copyToClipboardHandler: ValueClickHandler = {
  canHandle: (segment: Segment) => typeof segment.value === 'string',
  handler: (segment: Segment) => {
    navigator.clipboard.writeText(segment.value).then(() => {
      alert(`Copied "${segment.value}" to clipboard!`);
    });
  },
};

customValueClickHandlers: ValueClickHandler[] = [
  this.copyToClipboardHandler,
  // Add addt'l custom handlers here
];
```

**In your component's HTML file:**

<!-- prettier-ignore -->
```html
<ngx-json-treeview
  [json]="someObject"
  [enableClickableValues]="true"
  [valueClickhandlers]="customValueClickHandlers"
/>
```

In this example, any string value will be clickable. When clicked, it will be
copied to the clipboard.

#### Combining Handlers

Custom handlers can be combined alongside the built-in ones (such as the URL
handler). To apply all of the default built-in handlers, you can import the `VALUE_CLICK_HANDLERS` array and spread it into your `customValueClickHandlers`
array. Alternatively, handlers be the imported individually via
`ValueClickHandlers`.

```typescript
import {
  ValueClickHandlers,
  VALUE_CLICK_HANDLERS,
} from 'ngx-json-treeview';

customValueClickHandlers: ValueClickHandler[] = [
  ...VALUE_CLICK_HANDLERS,
  this.copyToClipboardHandler,
];

// OR

customValueClickHandlers: ValueClickHandler[] = [
  ValueClickHandlers.followLinkHandler,
  this.copyToClipboardHandler,
];
```

In this example, any string that matches a URL will trigger the `followLinkHandler`, and all other strings will trigger the `copyToClipboardHandler`.

## Theming

You can customize the appearance of the tree view using these CSS variables:

| Variable                   | Description                            |
| -------------------------- | -------------------------------------- |
| `--ngx-json-font-family`   | Font family for the tree view.         |
| `--ngx-json-font-size`     | Font size for the tree view.           |
| `--ngx-json-focus-color`   | Outline color for focused elements.    |
| `--ngx-json-toggler`       | Color of the expand/collapse toggler.  |
| `--ngx-json-key`           | Color of object keys.                  |
| `--ngx-json-label`         | Color of array indices.                |
| `--ngx-json-value`         | Default color for primitive values.    |
| `--ngx-json-string`        | Color for string values.               |
| `--ngx-json-number`        | Color for number values.               |
| `--ngx-json-boolean`       | Color for boolean values.              |
| `--ngx-json-date`          | Color for date values.                 |
| `--ngx-json-function`      | Color for function values.             |
| `--ngx-json-null`          | Text color for null values.            |
| `--ngx-json-null-bg`       | Background color for null values.      |
| `--ngx-json-undefined`     | Text color for undefined values.       |
| `--ngx-json-undefined-key` | Key color for undefined values.        |
| `--ngx-json-undefined-bg`  | Background color for undefined values. |
| `--ngx-json-punctuation`   | Color of braces, brackets, and commas. |

## Thanks

ngx-json-treeview is originally based on
[ngx-json-viewer](https://github.com/hivivo/ngx-json-viewer) by Vivo Xu and contributors.
