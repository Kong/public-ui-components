# spec-operations-list

A Kong UI component for displaying a filterable list of spec operations

- [Features](#features)
- [Requirements](#requirements)
- [Usage](#usage)
  - [Install](#install)
  - [Register](#register)
- [Props](#props)
  - [`operations`](#operations)
  - [`tags`](#tags)
  - [`isFilterable`](#isfilterable)
  - [`width`](#width)
  - [`filterFunction`](#filterfunction)
- [Slots](#slots)
  - [`item`](#item)
  - [`empty-state`](#empty-state)
  - [`error-state`](#error-state)
- [Emits](#emits)
  - [`selected`](#selected)
- [Theming](#theming)

## Features

- Render spec operations
- Support the ability filter and select items from the list

## Requirements

- `vue` must be initialized in the host application

## Usage

### Install

Install the component in your host application

```sh
yarn add @kong-ui-public/spec-renderer
```

### Register

You can register `spec-operations-list` globally or locally.

```typescript
// Global registration
import { createApp } from 'vue'
import { SpecOperationsList } from '@kong-ui-public/spec-renderer'
import '@kong-ui-public/spec-renderer/dist/style.css'

const app = createApp(App)

app.use(SpecOperationsList)

```

```html
<!-- Local registration -->
<template>
  <SpecOperationsList />
</template>

<script setup lang="ts">
import { SpecOperationsList } from '@kong-ui-public/spec-renderer'
import '@kong-ui-public/spec-renderer/dist/style.css'
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

### `filterFunction`

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

##### `select`

- type: 'Function'
- required: `true`

Handler function to call when item is selected, usually on click event.

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

| CSS Variable                                                                 | Purpose                                                | Default                         |
|------------------------------------------------------------------------------|--------------------------------------------------------|---------------------------------|
| `--kong-ui-spec-renderer-operations-list-filter-icon-color`                  | Operations list filter input icon color                | `#1C1B1F`                       |
| `--kong-ui-spec-renderer-operations-list-font-family`                        | Operations list font family                            | `Roboto, Helvetica, sans-serif` |
| `--kong-ui-spec-renderer-operations-list-font-size`                          | Operations list font size                              | `16px`                          |
| `--kong-ui-spec-renderer-operations-list-font-text-color`                    | Operations list text color                             | `#0B172D`                       |
| `--kong-ui-spec-renderer-operations-list-item-border-color`                  | Operations list item border color                      | `#f1f1f5`                       |
| `--kong-ui-spec-renderer-operations-list-item-padding`                       | Operations list item padding                           | `12px 16px`                     |
| `--kong-ui-spec-renderer-operations-list-item-background-hover`              | Operations list item background on hover               | `#f2f6fe`                       |
| `--kong-ui-spec-renderer-operations-list-item-background-selected`           | Operations list selected item background               | `#f2f6fe`                       |
| `--kong-ui-spec-renderer-operations-list-item-selected-bar-width`            | Operations list selected item highlight bar width      | `4px`                           |
| `--kong-ui-spec-renderer-operations-list-item-selected-bar-background`       | Operations list selected item highlight bar background | `#1155cb`                       |
| `--kong-ui-spec-renderer-operations-list-item-path-font-family`              | Operations list item resource path font family         | `monospace`                     |
| `--kong-ui-spec-renderer-operations-list-item-summary-text-color`            | Operations list selected item summary text color       | `#0B172D`                       |
| `--kong-ui-spec-renderer-operations-list-item-summary-text-color-selected`   | Operations list item summary text color                | `#3C4557`                       |
| `--kong-ui-spec-renderer-method-color-get`                                   | Operations list item GET method badge color            | `#1155cb`                       |
| `--kong-ui-spec-renderer-method-background-get`                              | Operations list item GET method badge background       | `#f2f6fe`                       |
| `--kong-ui-spec-renderer-method-color-post`                                  | Operations list item POST method badge color           | `#13755e`                       |
| `--kong-ui-spec-renderer-method-background-post`                             | Operations list item POST method badge background      | `#e8f8f5`                       |
| `--kong-ui-spec-renderer-method-color-put`                                   | Operations list item PUT method badge color            | `#a05604`                       |
| `--kong-ui-spec-renderer-method-background-put`                              | Operations list item PUT method badge background       | `#fff3d8`                       |
| `--kong-ui-spec-renderer-method-color-patch`                                 | Operations list item PATCH method badge color          | `#006e9d`                       |
| `--kong-ui-spec-renderer-method-background-patch`                            | Operations list item PATCH method badge background     | `#cdf1fe`                       |
| `--kong-ui-spec-renderer-method-color-delete`                                | Operations list item DELETE method badge color         | `#922021`                       |
| `--kong-ui-spec-renderer-method-background-delete`                           | Operations list item DELETE method badge background    | `#ffdede`                       |
| `--kong-ui-spec-renderer-method-color-options`                               | Operations list item OPTIONS method badge color        | `#273c61`                       |
| `--kong-ui-spec-renderer-method-background-options`                          | Operations list item OPTIONS method badge background   | `#f0f4fa`                       |
| `--kong-ui-spec-renderer-method-color-head`                                  | Operations list item HEAD method badge color           | `#a05604`                       |
| `--kong-ui-spec-renderer-method-background-head`                             | Operations list item HEAD method badge background      | `#fff3d8`                       |
| `--kong-ui-spec-renderer-method-color-connect`                               | Operations list item CONNECT method badge color        | `#473cfb`                       |
| `--kong-ui-spec-renderer-method-background-connect`                          | Operations list item CONNECT method badge background   | `#eaf4fb`                       |
| `--kong-ui-spec-renderer-method-color-trace`                                 | Operations list item TRACE method badge color          | `#5c7299`                       |
| `--kong-ui-spec-renderer-method-background-trace`                            | Operations list item TRACE method badge background     | `#f0f4fa`                       |
| `--kong-ui-spec-renderer-operations-list-section-background`                 | Operations list section background                     | `transparent`                   |
| `--kong-ui-spec-renderer-operations-list-section-border-color`               | Operations list section border color                   | `#f1f1f5`                       |
| `--kong-ui-spec-renderer-operations-list-section-border-radius`              | Operations list section border radius                  | `4px`                           |
| `--kong-ui-spec-renderer-operations-list-section-padding`                    | Operations list section padding                        | `8px`                           |
| `--kong-ui-spec-renderer-operations-list-section-label-font-size`            | Operations list section label font size                | `18px`                          |
| `--kong-ui-spec-renderer-operations-list-section-label-text-color`           | Operations list section label text color               | `#0B172D`                       |
| `--kong-ui-spec-renderer-operations-list-section-label-text-color-collapsed` | Operations list collapsed section label text color     | `#3C4557`                       |
| `--kong-ui-spec-renderer-operations-list-section-description-font-family`    | Operations list section description font family        | `monospace`                     |
| `--kong-ui-spec-renderer-operations-list-section-icon-color-collapsed`       | Operations list collapsed section icon color           | `#b6b6bd`                       |
| `--kong-ui-spec-renderer-operations-list-section-icon-color-expanded`        | Operations list expanded section icon color            | `#3c4557`                       |
