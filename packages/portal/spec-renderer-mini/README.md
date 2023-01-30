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

If enabled, will display Filter input and enable filtering operations by tag names using case-insensitive partial matching.

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
