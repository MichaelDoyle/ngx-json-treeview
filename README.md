# ngx-json-treeview

A simple Angular component to display object data in an expandable JSON tree view.

<img width="751" alt="image" src="https://github.com/user-attachments/assets/6025f020-727e-4098-bcb9-146fb2b66c0a" />

## Key Features

- Display JSON objects and arrays in a collapsible tree structure.
- Customize styling with CSS variables.
- Clickable value nodes for custom interactions.
- Control over initial expansion depth.
- Keyboard navigable

## Demo

[https://stackblitz.com/edit/ngx-json-treeview](https://stackblitz.com/edit/ngx-json-treeview?file=src%2Fapp%2Fapp.component.ts)

## Install

```bash
npm install ngx-json-treeview
```

## Usage

To render JSON in its fully expanded state.

```html
<ngx-json-treeview [json]="someObject" />
```

To render JSON with all nodes collapsed.

```html
<ngx-json-treeview [json]="someObject" [expanded]="false" />
```

Alternatively, expand only to a max depth by default.

```html
<ngx-json-treeview [json]="someObject" [depth]="1" />
```

You can enable the user to click on values. Provide `onValueClick` to implement
the desired behavior.

```html
<ngx-json-treeview [json]="someObject" [enableClickableValues]="true" (onValueClick)="onValueClick($event)" />
```

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
