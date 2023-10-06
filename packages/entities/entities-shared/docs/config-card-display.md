# ConfigCardDisplay.vue

A wrapper component for flexible display of entity configuration fields.

- [Requirements](#requirements)
- [Usage](#usage)
  - [Install](#install)
  - [Props](#props)
  - [Usage example](#usage-example)
- [TypeScript interfaces](#typescript-interfaces)

## Requirements

- `vue` and `vue-router` must be initialized in the host application
- `@kong/kongponents` must be added as a `dependency` in the host application, globally available via the Vue Plugin installation, and the package's style imports must be added in the app entry file. [See here for instructions on installing Kongponents](https://kongponents.konghq.com/#globally-install-all-kongponents).

## Usage

### Install

[See instructions for installing the `@kong-ui-public/entities-shared` package.](../README.md#install)

### Props

#### `item`

- type: `Object`
- required: `false`
- default: `undefined`

The base item configuration when format is structured.

#### `format`

- type: `String`
- required: `false`
- default: `'structured'`

Format to be displayed in the Config Card. Can be `structured`, `json`, or `yaml`.

#### `propListTypes`

- type: `Array as PropType<String[]>`
- required: `false`
- default: `undefined`

List types of element in the item object.

#### `record`

- type: `Object as PropType<Record<string, any>>`
- required: `false`
- default: `null`

The base record configuration when format is either JSON or YAML.

### Usage example

Please refer to the [sandbox](../sandbox/pages/ConfigCardDisplayPage.vue).

## TypeScript interfaces

Currently, we don't have any typescript interfaces exported from this component.
