# @kong-ui-public/spec-renderer

A Kong UI component for displaying and filtering API specs

- [Features](#features)
- [Requirements](#requirements)
- [Usage](#usage)
  - [Install](#install)
  - [Register](#register)
- [Subcomponents](#subcomponents)
  - [`SpecRenderer`](#specrenderer)
  - [`SpecOperationsList`](#specoperationslist)
  - [`SpecDetails`](#specdetails)

## Features

- Render spec with optional side nav and filtering

## Requirements

- `vue` must be initialized in the host application
- `@kong/kongponents` must be available as a `dependency` in the host application, along with the package's style imports. [See here for instructions on installing Kongponents](https://kongponents.konghq.com/#globally-install-all-kongponents). Specifically, the following Kongponents must be available:
  - `KBadge`
  - `KCollapse`
  - `KIcon`
  - `KInput`

## Usage

### Install

Install the component in your host application

```sh
yarn add @kong-ui-public/spec-renderer
```

### Register

You can register `spec-renderer` locally. In order to support proper tree-shaking in the host application, please only import and register the components in the page/component where they are being utilized.

```html
<!-- Local registration -->
<template>
  <SpecRenderer />
  <SpecOperationsList />
  <SpecDetails />
</template>

<script setup lang="ts">
// Only import the components you need
import { SpecRenderer, SpecOperationsList, SpecDetails } from '@kong-ui-public/spec-renderer'
// CSS import required for ANY of the components
import '@kong-ui-public/spec-renderer/dist/style.css'
</script>
```

## Subcomponents

The `SpecRenderer` component is a combination of two subcompoents, `SpecOperationsList` and `SpecDetails` which are exported for individual use if desired.

### `SpecRenderer`

See the component [documentation](docs/spec-renderer).

### `SpecOperationsList`

See the component [documentation](docs/spec-operations-list).

### `SpecDetails`

See the component [documentation](docs/spec-details).
