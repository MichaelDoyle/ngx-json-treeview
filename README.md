# ngx-json-treeview

A simple Angular component to display object data in an expandable JSON tree view.

<img width="751" alt="image" src="https://github.com/user-attachments/assets/6025f020-727e-4098-bcb9-146fb2b66c0a" />

## Key Features

- Expandable/collapsible nodes.
- Configurable initial expansion state and depth.
- Optional click handling for value nodes.
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

Theming can be done with CSS variables

```css
--ngx-json-string        /* color of string values */
--ngx-json-number        /* color of number values */
--ngx-json-boolean       /* color of boolean values */
--ngx-json-date          /* color of date values */
--ngx-json-function      /* color of function values */
--ngx-json-null          /* color of null values */
--ngx-json-null-bg       /* background color of null values */
--ngx-json-undefined     /* color of undefined values */
--ngx-json-undefined-bg  /* background color of undefined values */
--ngx-json-toggler       /* color of toggler */
--ngx-json-key           /* color of keys */
--ngx-json-punctuation   /* color of punctuation (':', '{', '}', etc) */
--ngx-json-value         /* color of values */
--ngx-json-undefined-key /* color for key of undefined values */
--ngx-json-label         /* color of preview labels */
--ngx-json-font-family   /* font-family */
--ngx-json-font-size     /* font-size */
```

## Thanks

ngx-json-treeview is originally based on
[ngx-json-viewer](https://github.com/hivivo/ngx-json-viewer) by Vivo Xu and contributors.
