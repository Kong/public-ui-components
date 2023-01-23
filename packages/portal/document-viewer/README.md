# @kong-ui/portal-document-viewer

A Kong UI component for rendering markdown documents

- [Features](#features)
- [Requirements](#requirements)
- [Usage](#usage)
  - [Install](#install)
  - [Register](#register)
- [Props](#props)
  - [`document`](#document)

## Features

- Render `.md` content
- Customize display of markdown content in the UI

## Requirements

- `vue` must be initialized in the host application

## Usage

### Install

Install the component in your host application

```sh
yarn add @kong-ui/portal-document-viewer
```

### Register

You can register `portal-document-viewer` globally or locally.

```typescript
// Global registration
import { createApp } from 'vue'
import DocumentViewer from '@kong-ui/portal-document-viewer'
import '@kong-ui/portal-document-viewer/dist/style.css'

const app = createApp(App)

app.use(DocumentViewer)

```

```html
<!-- Local registration -->
<template>
  <DocumentViewer />
</template>

<script setup lang="ts">
import DocumentViewer from '@kong-ui/portal-document-viewer'
import '@kong-ui/portal-document-viewer/dist/style.css'
</script>
```

## Props

### `document`

- type: `String|Object`
- required: `true`
- default: `null`

Markdown object or string. Required.
