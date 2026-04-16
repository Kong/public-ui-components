# CustomPluginForm.vue

A multi-step form component for creating and editing custom Kong plugins. Supports three deployment modes: Installed, Streamed, and Cloned, with step-based guidance and plugin comparison visualization.

- [Requirements](#requirements)
- [Usage](#usage)
  - [Install](#install)
  - [Props](#props)
  - [Events](#events)
  - [Slots](#slots)
  - [Usage example](#usage-example)
- [Features](#features)
  - [Three Plugin Deployment Modes](#three-plugin-deployment-modes)
  - [Comparison Table](#comparison-table)
  - [Step-Based Guidance](#step-based-guidance)
  - [Edit Mode](#edit-mode)
  - [Plugin Icon Support](#plugin-icon-support)

## Requirements

- `vue` and `vue-router` must be initialized in the host application
- `@kong/kongponents` must be added as a `dependency` in the host application, globally available via the Vue Plugin installation, and the package's style imports must be added in the app entry file. [See here for instructions on installing Kongponents](https://kongponents.konghq.com/#globally-install-all-kongponents).

## Usage

### Install

[See instructions for installing the `@kong-ui-public/entities-plugins` package.](../README.md#install)

### Props

#### `config`

- type: `Object as PropType<CustomPluginFormConfig>`
- required: `true`
- default: `undefined`
- properties:
  - `app`:
    - type: `'konnect'`
    - required: `true`
    - App name (currently Konnect only).

  - `apiBaseUrl`:
    - type: `string`
    - required: `true`
    - Base URL for API requests.

  - `controlPlaneId`:
    - type: `string`
    - required: `true`
    - The control plane ID.

  - `cancelRoute`:
    - type: `RouteLocationRaw`
    - required: `true`
    - Route to navigate to when form is cancelled.

  - `clonablePlugins`:
    - type: `ClonablePlugin[]`
    - required: `false`
    - default: `undefined`
    - Array of available plugins for cloning. Only needed when using "Cloned" plugin type.
    - Each item has: `{ label: string, value: string }`

The base Konnect config for the form.

#### `pluginId`

- type: `String`
- required: `false`
- default: `''`

The ID of an existing plugin when in edit mode. When provided, the form enters edit mode and hides Step 1 (plugin type selection).

### Events

#### `update`

Emitted when the form is submitted with valid data.

Payload: `FormPayload` - Union type containing:
- `InstalledPluginPayload`: `{ pluginType: 'installed', schemaFile: File }`
- `StreamedPluginPayload`: `{ pluginType: 'streamed', schemaFile: File, handlerFile: File, name: string }`
- `ClonedPluginPayload`: `{ pluginType: 'cloned', sourcePlugin: string, aliasName: string, priority?: string }`

#### `error`

Emitted when an error occurs during form submission.

Payload: `Error` object with error details.

#### `loading`

Emitted to indicate loading state during form submission.

Payload: `boolean` - `true` when loading starts, `false` when complete.

### Slots

None. The form structure is fixed and all content is controlled via props.

### Usage example

```vue
<template>
  <CustomPluginForm
    :config="formConfig"
    :plugin-id="currentPluginId"
    @update="handleFormSubmit"
    @error="handleError"
    @loading="isLoading = $event"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import CustomPluginForm from '@kong-ui-public/entities-plugins/CustomPluginForm.vue'
import type { CustomPluginFormConfig, FormPayload } from '@kong-ui-public/entities-plugins'

const router = useRouter()
const isLoading = ref(false)
const currentPluginId = ref('')

const formConfig: CustomPluginFormConfig = {
  app: 'konnect',
  apiBaseUrl: 'https://api.example.com',
  controlPlaneId: 'my-control-plane',
  cancelRoute: { name: 'plugins-list' },
}

const handleFormSubmit = (payload: FormPayload) => {
  console.log('Form submitted:', payload)
  // Handle submission - send to API, etc.
}

const handleError = (error: Error) => {
  console.error('Form error:', error)
}
</script>
```

## Features

### Three Plugin Deployment Modes

1. **Installed Custom Plugin**
   - Full control over deployment and runtime
   - Requires data plane restart
   - Needs: schema file

2. **Streamed Custom Plugin**
   - Deploy to running data planes without gateway access
   - No restart required
   - Needs: schema file, handler file, plugin name

3. **Cloned Plugin**
   - Duplicate an existing plugin with different name/priority
   - Modify execution priority with +/- notation or absolute numbers
   - Needs: source plugin selection, alias name, optional priority

### Comparison Table

The form includes a collapsible comparison table showing differences between the three deployment modes:
- Main use cases
- Files supplied
- Installation method
- Sandboxing behavior
- Data plane reload requirements

### Step-Based Guidance

- **Create Mode**: 3 steps (plugin type → files/setup → general info)
- **Edit Mode**: Steps are renumbered (hidden step 1), and single-step deployments don't show step numbers

### Edit Mode

When `pluginId` is provided:
- Step 1 (plugin type selection) is hidden
- Plugin type cannot be changed
- Submit action becomes an update operation (implementation pending)

### Plugin Icon Support

Each plugin in the clonable list displays:
- Plugin icon in dropdown items
- Plugin icon in selected value
