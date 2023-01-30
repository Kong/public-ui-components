# @kong-ui-public/spec-renderer-mini

A Kong UI mini component for displaying API specs

- [Features](#features)
- [Requirements](#requirements)
- [Usage](#usage)
  - [Install](#install)
  - [Register](#register)
- [Props](#props)
  - [`spec`](#spec)
  - [`tags`](#tags)
  - [`isFilterable`](#isfilterable)
  - [`width`](#width)
  - [`filterFunc`](#filterfunc)
- [Slots](#slots)
  - [`item`](#item)
  - [`empty-state`](#empty-state)
  - [`error-state`](#error-state)
- [Emits](#emits)
  - [`selected`](#selected)

## Features

- Render spec styled object arrays
- Support both table of contents and list summary views

## Requirements

- `vue` must be initialized in the host application

## Usage

### Install

Install the component in your host application

```sh
yarn add @kong-ui-public/spec-renderer-mini
```

### Register

You can register `portal-spec-renderer-mini` globally or locally.

```typescript
// Global registration
import { createApp } from 'vue'
import SpecRendererMini from '@kong-ui-public/spec-renderer-mini'
import '@kong-ui-public/spec-renderer-mini/dist/style.css'

const app = createApp(App)

app.use(SpecRendererMini)

```

```vue
<!-- Local registration -->
<template>
  <SpecRendererMini />
</template>

<script setup lang="ts">
import SpecRendererMini from '@kong-ui-public/spec-renderer-mini'
import '@kong-ui-public/spec-renderer-mini/dist/style.css'
</script>
```

## Props

### `operations`

- type: `Object[]`
- required: `true`

Operation object array. Required.
The objects should conform to the following interface.

```typescript
{
  /**
   * Relative operation path with optional path templating.
   * See https://swagger.io/specification/#paths-object
   */
  path: string
  /**
   * HTTP Method
   */
  method: string
  /**
   * Optional operationId
   */
  operationId: string | null
  /**
   * List of tag names for the operation used to group operations into sections
   */
  tags: string[]
  /**
   * Short summary of the operation
   */
  summary: string | null
  /**
   * Is the operation deprecated?
   */
  deprecated: boolean
}
```

### `tags`

- type: `Object[]`
- required: `false`
- default: `[]`

Object array for tags. You can use this to specify tag information such as `description` and `externalDocs`.

```typescript
{
  /**
   * Tag name
   * See {@link Operation.tags} for usage details
   */
  name: string
  /**
   * Optional description.
   * CommonMark formatting is not supported at the moment.
   */
  description?: string
  /**
   * Optional link to external docs of the tag
   */
  externalDocs?: {
    description?: string
    url: string
  }
}
```

### `isFilterable`

- type: `Boolean`
- required: `false`
- default: `true`

If enabled, will display filter input and enable filtering operations by tag names using case-insensitive partial matching.

### `width`

- type: `String`
- required: `false`
- default: `210`

Controls the width of the rendered spec. Currently supports numbers (will be converted to px), auto, `vw`, `vh`, and percentages for width.

### `filterFunc`

- type: `Function`
- required: `false`

Overrides the default filter function. Provided function must return a list of Operation objects.

#### Example

```typescript
const operationSummaryFilterFunc: OperationListFilterFunction = ({ items, query }) => {
  return items.filter((item) => item.summary.includes(query))
}
```


## Slots

### `item`

Controls the content of a single operation.

#### Slot props

##### `item`

- type: `Object`
- required: `true`

Operation object of the item to display.

##### `section`

- type: `String`
- required: `false`

Section (tag) name or `undefined` if operation is untagged.

### `empty-state`

Controls the content displayed when the `spec` array is empty.

### `error-state`

Controls the content when `spec` is not provided.

## Emits

### `selected`

- returns: `Object` - the last clicked item data

```typescript
{
  path: string
  method: string
  operationId: string | null
  tags: string[]
  summary: string | null
  deprecated: boolean
}
```

This is emitted whenever an item in the spec is clicked.

## Theming

| CSS Variable                                                            | Purpose                                                |
|-------------------------------------------------------------------------|--------------------------------------------------------|
| --kong-ui-spec-renderer-operations-list-filter-icon-color               | Operations list filter input icon color                |
| --kong-ui-spec-renderer-operations-list-font-family                     | Operations list font family                            |
| --kong-ui-spec-renderer-operations-list-font-size                       | Operations list font size                              |
| --kong-ui-spec-renderer-operations-list-font-text-color                 | Operations list text color                             |
| --kong-ui-spec-renderer-operations-list-item-border-color               | Operations list item border color                      |
| --kong-ui-spec-renderer-operations-list-item-padding                    | Operations list item padding                           |
| --kong-ui-spec-renderer-operations-list-item-background-hover           | Operations list item background on hover               |
| --kong-ui-spec-renderer-operations-list-item-background-selected        | Operations list selected item background               |
| --kong-ui-spec-renderer-operations-list-item-selected-bar-width         | Operations list selected item highlight bar width      |
| --kong-ui-spec-renderer-operations-list-item-selected-bar-background    | Operations list selected item highlight bar background |
| --kong-ui-spec-renderer-operations-list-item-path-font-family           | Operations list item resource path font family         |
| --kong-ui-spec-renderer-method-color-get                                | Operations list item GET method badge color            |
| --kong-ui-spec-renderer-method-background-get                           | Operations list item GET method badge background       |
| --kong-ui-spec-renderer-method-color-post                               | Operations list item POST method badge color           |
| --kong-ui-spec-renderer-method-background-post                          | Operations list item POST method badge background      |
| --kong-ui-spec-renderer-method-color-put                                | Operations list item PUT method badge color            |
| --kong-ui-spec-renderer-method-background-put                           | Operations list item PUT method badge background       |
| --kong-ui-spec-renderer-method-color-patch                              | Operations list item PATCH method badge color          |
| --kong-ui-spec-renderer-method-background-patch                         | Operations list item PATCH method badge background     |
| --kong-ui-spec-renderer-method-color-delete                             | Operations list item DELETE method badge color         |
| --kong-ui-spec-renderer-method-background-delete                        | Operations list item DELETE method badge background    |
| --kong-ui-spec-renderer-method-color-options                            | Operations list item OPTIONS method badge color        |
| --kong-ui-spec-renderer-method-background-options                       | Operations list item OPTIONS method badge background   |
| --kong-ui-spec-renderer-method-color-head                               | Operations list item HEAD method badge color           |
| --kong-ui-spec-renderer-method-background-head                          | Operations list item HEAD method badge background      |
| --kong-ui-spec-renderer-method-color-connect                            | Operations list item CONNECT method badge color        |
| --kong-ui-spec-renderer-method-background-connect                       | Operations list item CONNECT method badge background   |
| --kong-ui-spec-renderer-method-color-trace                              | Operations list item TRACE method badge color          |
| --kong-ui-spec-renderer-method-background-trace                         | Operations list item TRACE method badge background     |
| --kong-ui-spec-renderer-operations-list-section-background              | Operations list section background                     |
| --kong-ui-spec-renderer-operations-list-section-border-color            | Operations list section border color                   |
| --kong-ui-spec-renderer-operations-list-section-border-radius           | Operations list section border radius                  |
| --kong-ui-spec-renderer-operations-list-section-padding                 | Operations list section padding                        |
| --kong-ui-spec-renderer-operations-list-section-label-font-size         | Operations list section label font size                |
| --kong-ui-spec-renderer-operations-list-section-description-font-family | Operations list section description font family        |
| --kong-ui-spec-renderer-operations-list-section-icon-color-collapsed    | Operations list collapsed section icon color           |
| --kong-ui-spec-renderer-operations-list-section-icon-color-expanded     | Operations list expanded section icon color            |
