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

- type: `Object as PropType<KonnectCustomPluginFormConfig | KongManagerCustomPluginFormConfig>`
- required: `true`
- default: `undefined`

Supports both Konnect and Kong Manager configurations.

**Common properties:**

  - `app`:
    - type: `'konnect' | 'kongManager'`
    - required: `true`
    - App type identifier.

  - `apiBaseUrl`:
    - type: `string`
    - required: `true`
    - Base URL for API requests.

  - `cancelRoute`:
    - type: `RouteLocationRaw`
    - required: `true`
    - Route to navigate to when form is cancelled.

  - `successRoute`:
    - type: `RouteLocationRaw`
    - required: `true`
    - Route to navigate to after successful create/update.

  - `clonablePlugins`:
    - type: `string[]`
    - required: `false`
    - default: `undefined`
    - Array of available plugin names for cloning. Only needed when using "Cloned" plugin type.

  - `workspace`:
    - type: `string` for Kong Manager, `string | null` for Konnect
    - required: `true` for Kong Manager, `false` for Konnect
    - default: `undefined`
    - The workspace name. Note: Kong Manager does not support installed custom plugins — pass `unsupportedTypes: ['installed']`.

**Konnect-specific:**

  - `controlPlaneId`:
    - type: `string`
    - required: `true`
    - The control plane ID.


#### `pluginName`

- type: `String`
- required: `false`
- default: `''`

The name of an existing plugin when in edit mode. When provided, the form enters edit mode and hides Step 1 (plugin type selection).

#### `unsupportedTypes`

- type: `CustomPluginFormType[]`
- required: `false`
- default: `[]`

List of custom plugin types to hide in create mode. If all three types are unsupported, the component renders an error state instead of the form.

### Events

#### `update`

Emitted when the form is submitted with valid data.

Payload: `InstalledPluginResponse | StreamedPluginResponse | ClonedPluginPayload`
- `InstalledPluginResponse`: API response for installed plugins (contains `item.lua_schema`, `item.name`, etc.)
- `StreamedPluginResponse`: API response for streamed plugins (contains `id`, `name`, `schema`, `handler`, etc.)
- `ClonedPluginPayload`: `{ pluginType: 'cloned', sourcePlugin: string, aliasName: string, priority?: string }`

#### `error`

Emitted when an error occurs during data fetching (edit mode) or form submission.

Payload: `unknown` - the error object.

#### `loading`

Emitted to indicate loading state during data fetching (edit mode).

Payload: `boolean` - `true` when loading starts, `false` when complete.

### Slots

None. The form structure is fixed and all content is controlled via props.

### Usage example

```vue
<template>
  <CustomPluginForm
    :config="formConfig"
    :plugin-name="currentPluginName"
    :unsupported-types="['cloned']"
    @error="handleError"
    @loading="isLoading = $event"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import CustomPluginForm from '@kong-ui-public/entities-plugins/CustomPluginForm.vue'
import type { KonnectCustomPluginFormConfig } from '@kong-ui-public/entities-plugins'

const isLoading = ref(false)
const currentPluginName = ref('')

const formConfig: KonnectCustomPluginFormConfig = {
  app: 'konnect',
  apiBaseUrl: 'https://api.example.com',
  controlPlaneId: 'my-control-plane',
  cancelRoute: { name: 'plugins-list' },
  successRoute: { name: 'plugins-list' },
}

const handleError = (error: unknown) => {
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

When `pluginName` is provided:
- The component fetches the existing plugin data (tries installed, then streamed endpoints)
- Step 1 (plugin type selection) is hidden
- Plugin type cannot be changed
- File upload fields show "File not changed" placeholder; re-upload is optional
- Submit calls the appropriate update API endpoint

### Plugin Icon Support

Each plugin in the clonable list displays:
- Plugin icon in dropdown items
- Plugin icon in selected value
