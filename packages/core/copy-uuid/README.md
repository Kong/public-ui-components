# @kong-ui-public/copy-uuid

A Kong UI component for displaying uuid and copying it to clipboard.

- [Features](#features)
- [Requirements](#requirements)
- [Usage](#usage)
  - [Install](#install)
  - [Register](#register)
  - [Initialize](#initialize)
- [TypeScript interfaces](#typescript-interfaces)
- [Props](#props)
  - [`uuid`](#uuid)
  - [`truncated`](#truncated)
  - [`useMono`](#usemono)
  - [`isHidden`](#ishidden)
  - [`notify`](#notify)
  - [`iconColor`](#iconcolor)
  - [`tooltip`](#tooltip)
  - [`successTooltip`](#successtooltip)
  - [`showUuid`](#showuuid)
- [Events](#events)
  - [`success`](#success)
  - [`error`](#error)

## Features

- Configurable uuid appearances
- Ability to copy the uuid to clipboard with one click
- Customizable `notify` method through `provide` or `prop`

![copy-uuid component example with different appearances](./docs/copy-uuid.jpg)

## Requirements

- `vue` must be initialized in the host application
- `@kong/kongponents` must be available as a `dependency` in the host application, along with the package's style imports. [See here for instructions on installing Kongponents](https://kongponents.konghq.com/#globally-install-all-kongponents). Specifically, the following Kongponents must be available:
  - `KClipboardProvider`
  - `KIcon`
- `@kong-ui-public/i18n` must be available as a `dependency` in the host application.

## Usage

### Install

Install the component in your host application

```sh
yarn add @kong-ui/copy-uuid
```

### Register

You can register `copy-uuid` globally or locally.

```typescript
// Global registration
import { createApp } from 'vue'
import CopyUuid, { CopyUuidNotifyParam } from '@kong-ui/copy-uuid'
import '@kong-ui/copy-uuid/dist/style.css'

const app = createApp(App)

app.use(CopyUuid)
```

```html
<!-- Local registration -->
<template>
  <copy-uuid />
</template>

<script setup lang="ts">
import { CopyUuid } from '@kong-ui/copy-uuid'
</script>
```

### Initialize

You can set up an optional global `notify` method, and every `copy-uuid` component instance will use this method as a default.

If you're using `copy-uuid` as a vue plugin:

```typescript
// app entry file
import { createApp } from 'vue'
import CopyUuid, { CopyUuidNotifyParam } from '@kong-ui/copy-uuid'
import '@kong-ui/copy-uuid/dist/style.css'

const app = createApp(App)

app.use(CopyUuid, {
  notify: (props: CopyUuidNotifyParam) => {
    // Notify your end users
  }
})
```

If you prefer using `copy-uuid` as a component:

```typescript
// app entry file
import { createApp } from 'vue'
import { COPY_UUID_NOTIFY_KEY, CopyUuidNotifyParam } from '@kong-ui/copy-uuid'

const app = createApp(App)

app.provide(COPY_UUID_NOTIFY_KEY, (props: CopyUuidNotifyParam) => {
  // Notify your end users
})
```

You could also set up a `notify` method for each `copy-uuid` component instance through its `prop`. If the `notify` prop is defined, it'll take precedence over the global `notify` method:

```html
<template>
  <copy-uuid
    <!-- other props -->
    :notify="notify"
  />
</template>

<script setup lang="ts">
  import { CopyUuidNotifyParam } from '@kong-ui/copy-uuid'

  const notify = (param: CopyUuidNotifyParam) => {
    // Notify your end users
  }
</script>
```

## TypeScript interfaces

TypeScript interfaces [are available here](https://github.com/Kong/public-ui-components/blob/main/packages/core/copy-uuid/src/types/) and can be directly imported into your host application. The following interfaces are available for import:

```ts
import type { CopyUuidNotifyParam, CopyUuidInstallOptions } from '@kong-ui/copy-uuid'
```

## Props

### `uuid`

- type: `String`
- required: `true`

The UUID string. When the copy button is clicked, this string will be copied to clipboard.

### `truncated`

- type: `Boolean`
- required: `false`
- default: `true`

An indicator of whether a long UUID is truncated. When `true`, the UUID will be truncated to 8 characters. When `false`, the UUID will be displayed in full.

### `useMono`

- type: `Boolean`
- required: `false`
- default: `true`

An indicator of whether a `.mono` class is added to the UUID string. Make sure to import the Kongponents style file in your host application for this class to take effect.

### `isHidden`

- type: `Boolean`
- required: `false`
- default: `false`

An indicator of whether the UUID string is replaced with asterisks.

### `notify`

- type: `Function as PropType<(param: CopyUuidNotifyParam) => void>`
- required: `false`
- default: `undefined`

A function that will be called when the copy button is clicked. The function will receive a `CopyUuidNotifyParam` object as its only argument. The `CopyUuidNotifyParam` object has the following properties:

- `type`: `success` | `error`, indicating whether the copy operation is successful
- `message`: `string`, the message to be displayed to the end user

### `iconColor`

- type: `String`
- required: `false`
- default: `'rgba(0, 0, 0, 0.45)'`

The color of the `copy` icon.

### `tooltip`

- type: `String`
- required: `false`
- default: `''`

Tooltip text to display on hovering over the copy icon. This field is required if `successTooltip` has a value.

### `successTooltip`

- type: `String`
- required: `false`
- default: `''`

Note: The `tooltip` prop is required to have a value in order to use this prop. When using this prop the `@success` and `@error` events will not be fired, as the tooltip text will be updated instead.
Tooltip text to display on successful copy.

### `showUuid`

- type: `Boolean`
- required: `false`
- default: `true`

If false the UUID will not be shown at all. Useful for the case the host app wants to display something that the uuid resolves to, but still be able to copy the uuid behind the scenes.

## Events

Success and error events are only emitted if NOT using the `successTooltip` prop.

### `success`

A `success` event is emitted when the UUID is successfully copied to clipboard. The event payload is the UUID.

### `error`

An `error` event is emitted when an error occurs when trying to copy the UUID. The event payload is the UUID.
