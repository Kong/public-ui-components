# RouterPlaygroundModal

The `RouterPlaygroundModal` component is a modal that allows the user to edit route expression and see the result of the expression evaluation.

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

#### `isVisible`

- type: `boolean`
- required: `true`
- default: `false`

Controls whether the modal is visible or not.

#### `localstorageKey`

- type: `String`
- required: `optional`
- default: `kong-manager-router-playground-requests`

The key to use for storing the playground requests in the local storage.

#### `hideEditorActions`

- type: `boolean`
- required: `false`
- default: `false`

Controls whether the editor actions should be hidden or not.

#### `initialExpression`

- type: `string`
- required: `false`

The initial expression to be displayed in the editor.

### Events

#### change

An `change` event is emitted when the expression has been updated.

#### commit

An `commit` event is emitted when the expression has been committed.

#### cancel

A `cancel` event is emitted when the modal's cancel button has been clicked.

#### notify

A `notify` event is emitted when the component needs to notify some information to user.

### Usage example

Please refer to the [sandbox](../sandbox/App.vue).

## TypeScript definitions

TypeScript definitions are bundled with the package and can be directly imported into your host application.
