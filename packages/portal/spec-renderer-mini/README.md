# @kong-ui/portal-spec-renderer-mini

A Kong UI mini component for displaying API specs

- [Features](#features)
- [Requirements](#requirements)
- [Usage](#usage)
  - [Install](#install)
  - [Register](#register)
- [Props](#props)
  - [`spec`](#spec)
  - [`isSummary`](#issummary)
  - [`width`](#width)
- [Slots](#slots)
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
yarn add @kong-ui/portal-spec-renderer-mini
```

### Register

You can register `portal-spec-renderer-mini` globally or locally.

```typescript
// Global registration
import { createApp } from 'vue'
import SpecRendererMini from '@kong-ui/portal-spec-renderer-mini'
import '@kong-ui/portal-spec-renderer-mini/dist/style.css'

const app = createApp(App)

app.use(SpecRendererMini)

```

```html
<!-- Local registration -->
<template>
  <SpecRendererMini />
</template>

<script setup lang="ts">
import SpecRendererMini from '@kong-ui/portal-spec-renderer-mini'
import '@kong-ui/portal-spec-renderer-mini/dist/style.css'
</script>
```

## Props

### `spec`

- type: `Object[]`
- required: `true`

Specification object array. Required.
The objects should conform to the following interface.

```typescript
{
  path: string
  method: string
  operationId: string | null
  tags: string[]
  summary: string | null
  deprecated: boolean
  selected?: boolean
  key?: string
}
```

### `isSummary`

- type: `Boolean`
- required: `false`
- default: `false`

If enabled, will display list summary view with a few more details instead of table of contents style.

### `width`

- type: `String`
- required: `false`
- default: `210`

Controls the width of the rendered spec. Currently supports numbers (will be converted to px), auto, `vw`, `vh`, and percentages for width.

## Slots

### `empty-state`

Controls the content displayed when the `spec` array is empty.

### `error-state`

Controls the content when `spec` is not provided.

## Emits

### `selected`

- returns: `Object` - the last clicked item data

```json
{
  path: string
  method: string
  operationId: string | null
  tags: string[]
  summary: string | null
  deprecated: boolean
  selected?: boolean
  key?: string
}
```

This is emitted whenever an item in the spec is clicked. Clicking an item will deselect any previously selected items.
