# ExpressionsEditor.vue

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

### Events

#### update:modelValue

An `update:modelValue` event is emitted when the editor content has been updated.

#### parse-result-update

A `@parse-result-update` event is emitted when the expression has been parsed and the result has been updated. You may import the `ParseResult` type from the package to explore the shape of the payload.

### Usage example

Please refer to the [sandbox](../sandbox/App.vue).

## TypeScript definitions

TypeScript definitions are bundled with the package and can be directly imported into your host application.
