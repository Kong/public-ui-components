# SensitiveInput.vue

An input component (built on top of `KInput`) for entering sensitive fields such as API keys or tokens.

- [Features](#features)
- [Requirements](#requirements)
- [Usage](#usage)
  - [Install](#install)
  - [Props](#props)
  - [Events](#events)
  - [Slots](#slots)
  - [Usage example](#usage-example)
- [TypeScript interfaces](#typescript-interfaces)

## Features

- Behaves like a regular `KInput` when creating a resource, with a built-in visibility toggle to reveal or mask the value.
- When editing an existing resource, starts in a read-only masked state with a "Rotate key" action that switches the field to the editable state.
- Optional "Generate key" action — only shown when a `generator` callback is provided, so the value can be generated locally or fetched from a backend, depending on the host application.
- Optional one-time hint banner ("The key is shown only once…") with a Copy action, displayed under the host application's control.

## Requirements

- `vue` must be initialized in the host application
- `@kong/kongponents` must be added as a `dependency` in the host application, globally available via the Vue Plugin installation, and the package's style imports must be added in the app entry file. [See here for instructions on installing Kongponents](https://kongponents.konghq.com/#globally-install-all-kongponents).

## Usage

### Install

[See instructions for installing the `@kong-ui-public/entities-shared` package.](../README.md#install)

### Props

#### `modelValue`

- type: `String`
- required: `false`
- default: `''`

The sensitive value. Bound via `v-model`.

#### `mode`

- type: `'create' | 'edit'`
- required: `false`
- default: `'create'`

Determines the initial state. `'create'` starts in the editable state. `'edit'` starts in a read-only masked state and shows a "Rotate key" action that switches the field to the editable state — use this when editing an existing resource, where the backend typically does not return the plaintext value.

#### `generator`

- type: `() => string | Promise<string>`
- required: `false`

When provided, a "Generate key" action is shown in the editable state. The returned value is written back through `v-model` and revealed in plain text. The generation logic (local crypto or a backend call) lives with the host application. When omitted, no "Generate key" action is rendered.

#### `showOneTimeHint`

- type: `Boolean`
- required: `false`
- default: `false`

When `true`, a one-time hint banner ("The key is shown only once. Copy it now and store it securely.") with a Copy action is rendered below the input, and the value is revealed in plain text. This is controlled by the host application (for example, after a successful save), and is not toggled automatically when a key is generated.

#### `labels`

- type: `SensitiveInputLabels`
- required: `false`

Overrides for the built-in UI texts, so the component can be reused for other credential types (passwords, tokens, …). Any omitted label falls back to its default. Available keys: `rotateLabel`, `generateLabel`, `hintLabel`. The input placeholder is configured separately via the `placeholder` prop.

#### Other props

The following props are forwarded to the underlying `KInput`: `label`, `labelAttributes`, `placeholder`, `help`, `required`, `disabled`, `readonly`, `error`, and `errorMessage`. When `placeholder` is omitted, a default placeholder ("Enter or generate a key") is used in the editable state.

### Events

#### update:modelValue

Emitted when the value changes (typing or generation). Enables `v-model`.

#### rotate

Emitted when the user clicks "Rotate key" and the field enters the editable state.

#### generate

Emitted when key generation starts (immediately before `generator` is awaited).

#### generated

Emitted with the generated key once `generator` resolves.

### Slots

#### alert

Rendered at the bottom of the component. Use it to display additional content such as a `KAlert` — for example, surfacing a notice after the `rotate` event fires.

```html
<template>
  <SensitiveInput
    v-model="apiKey"
    label="API key"
    mode="edit"
    @rotate="showAlert = true"
  >
    <template #alert>
      <KAlert
        v-if="showAlert"
        message="Once saved, the key value will not be visible."
      />
    </template>
  </SensitiveInput>
</template>
```

### Usage example

```html
<template>
  <SensitiveInput
    v-model="apiKey"
    label="API key"
    mode="edit"
    :generator="generateKey"
    :show-one-time-hint="showHint"
    @generated="onGenerated"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { SensitiveInput } from '@kong-ui-public/entities-shared'

const apiKey = ref('')
const showHint = ref(false)

const generateKey = (): string => {
  const bytes = new Uint8Array(24)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

const onGenerated = (key: string) => {
  // e.g. persist the generated key, then reveal the one-time hint
  showHint.value = true
}
</script>
```

Please also refer to the [sandbox](../sandbox/pages/SensitiveInputPage.vue).

## TypeScript interfaces

```ts
import type { SensitiveInputLabels } from '@kong-ui-public/entities-shared'
```
