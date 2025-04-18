# ngx-json-treeview

A collapsible JSON tree view for Angular

## Install

```bash
npm install ngx-json-treeview
```

## Usage

```html
<ngx-json-treeview [json]="someObject" />
```

## Theming

Theming can be done with CSS variables

- --ngx-json-string : color of string values
- --ngx-json-number : color of number values
- --ngx-json-boolean : color of boolean values
- --ngx-json-date : color of date values
- --ngx-json-array : color of array values
- --ngx-json-object : color of object values
- --ngx-json-function : color of function values
- --ngx-json-null : color of null values
- --ngx-json-null-bg : background color of null values
- --ngx-json-undefined : color of undefined values
- --ngx-json-toggler : color of toggler
- --ngx-json-key : color of keys
- --ngx-json-punctuation : color of punctuation (`:`, `{`, `}`, etc)
- --ngx-json-value : color of values
- --ngx-json-undefined-key : color for key of undefined values
- --ngx-json-label color of preview labels
- --ngx-json-font-family : font-family
- --ngx-json-font-size : font-size

## Thanks

ngx-json-treeview is originally based on
[ngx-json-viewer](https://github.com/hivivo/ngx-json-viewer) by Vivo Xu and contributors.
