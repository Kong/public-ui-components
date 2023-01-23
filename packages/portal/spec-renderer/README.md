# @kong-ui/portal-spec-renderer

A Kong UI component for displaying API specs

- [Features](#features)
- [Requirements](#requirements)
- [Usage](#usage)
  - [Install](#install)
  - [Register](#register)
- [Props](#props)
  - [`document`](#document)
  - [`url`](#url)
  - [`hasSidebar`](#hassidebar)
  - [`relativeSidebar`](#relativesidebar)
  - [`essentialsOnly`](#essentialsonly)
  - [`slimMode`](#slimmode)

## Features

- Render `.yaml` and `.json` OAS specs
- Customize display of API specs in the UI

## Requirements

- `vue` must be initialized in the host application

## Usage

### Install

Install the component in your host application

```sh
yarn add @kong-ui/portal-spec-renderer
```

### Register

You can register `portal-spec-renderer` globally or locally.

```typescript
// Global registration
import { createApp } from 'vue'
import SpecRenderer from '@kong-ui/portal-spec-renderer'
import '@kong-ui/portal-spec-renderer/dist/style.css'

const app = createApp(App)

app.use(SpecRenderer)

```

```html
<!-- Local registration -->
<template>
  <SpecRenderer />
</template>

<script setup lang="ts">
import SpecRenderer from '@kong-ui/portal-spec-renderer'
import '@kong-ui/portal-spec-renderer/dist/style.css'
</script>
```

## Props

### `document`

- type: `String|Object`
- required: `false`
- default: `null`

Specification object or string. Required if `url` property is not set.

### `url`

- type: `String`
- required: `false`
- default: `''`

URL of the specification file. Required if `document` property is not set.

### `hasSidebar`

- type: `Boolean`
- required: `false`
- default: `true`

Whether or not the SwaggerUI navigation sidebar is enabled.

### `relativeSidebar`

- type: `Boolean`
- required: `false`
- default: `false`

Position the sidebar relatively instead of fixed.
Both `hasSidebar` and `essentialsOnly` must be `true` for the positioning to be correct since we aren't predicting the height of the info block.

### `essentialsOnly`

- type: `Boolean`
- required: `false`
- default: `false`

If enabled, only display the spec `paths` section; general information, schemes, models, etc. are hidden.

### `slimMode`

- type: `Boolean`
- required: `false`
- default: `false`

If enabled, will apply styles to conserve space. Hides path descriptions, decreases font-size of headings.

