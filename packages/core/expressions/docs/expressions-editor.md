# ExpressionsEditor

A Monaco-based editor with autocomplete and syntax highlighting support for the expressions language.

- [Requirements](#requirements)
- [Usage](#usage)
  - [Install](#install)
  - [Props](#props)
  - [Events](#events)
  - [Usage example](#usage-example)
- [TypeScript definitions](#typescript-definitions)

## Requirements

[See requirements for the `@kong-ui-public/expressions` package.](../README.md#requirements)

## Usage

### Install

[See instructions for installing the `@kong-ui-public/expressions` package.](../README.md#install)

### Props

#### `modelValue`

- type: `String`
- required: `true`

The expression written in the Expressions language.

#### `schema`

- type: `NamedSchemaDefinition`
- required: `true`

The schema definition with a name that uniquely identifies the schema. It will be used for semantics validation and autocompletion.

#### `parseDebounce`

- type: `number`
- required: `false`
- default: `500`

The debounce time in milliseconds for parsing the expression and updating the parse result.

#### `inactiveUntilFocused`

- type: `boolean`
- required: `false`
- default: `false`

To control whether the editor should be inactive until its initial focus.

#### `allowEmptyInput`

- type: `boolean`
- required: `false`
- default: `false`

To control whether the editor should pass validation with an empty input.

#### `defaultShowDetails`

- type: `boolean`
- required: `false`
- default: `false`

To control whether the editor should show the details of the autocompletion item by default.

#### `editorOptions`

- type: `Monaco.editor.IEditorOptions`
- required: `false`
- default: `undefined`

Options to pass when creating the Monaco editor.

#### `provideRhsValueCompletion`

- type: `ProvideRhsValueCompletion`
- required: `false`
- default: `undefined`

A function to provide completion items for the value of the right-hand side (RHS) of the expression. The function should return a `Promise` that resolves to a `CompletionList` or `undefined`.

For example, in the following case:

```
http.path == "fo"
                ^cursor

↓↓ type "o" ↓↓

http.path == "foo"
                 ^cursor
```

… the `provideRhsValueCompletion` function will be called with the following arguments:

| Argument        | Value                                                                      |
| :-------------- | :------------------------------------------------------------------------- |
| `lhsValue`      | `"http.path"`                                                              |
| `rhsValueValue` | `"foo"`                                                                    |
| `lhsRange`      | `{ startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 9 }`   |
| `rhsValueRange` | `{ startLineNumber: 1, startColumn: 15, endLineNumber: 1, endColumn: 17 }` |

This function will only be triggered in either of the following cases:

- The completion is manually triggered by the user (e.g., with `Ctrl` `I`)
- A character is typed while the cursor is inside the range of the string value

### Events

#### update:modelValue

An `update:modelValue` event is emitted when the editor content has been updated.

#### parse-result-update

A `@parse-result-update` event is emitted when the expression has been parsed and the result has been updated. You may import the `ParseResult` type from the package to explore the shape of the payload.

### Usage example

Please refer to the [sandbox](../sandbox/App.vue).

## TypeScript definitions

TypeScript definitions are bundled with the package and can be directly imported into your host application.
