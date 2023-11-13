# PluginForm.vue

A form component for Plugins.

- [Requirements](#requirements)
- [Usage](#usage)
  - [Install](#install)
  - [Props](#props)
  - [Events](#events)
  - [Usage example](#usage-example)
- [TypeScript interfaces](#typescript-interfaces)

## Requirements

- `vue` and `vue-router` must be initialized in the host application
- `@kong/kongponents` must be added as a dependency in the host application, globally available via the Vue Plugin installation, and the package's style imports must be added in the app entry file. [See here for instructions on installing Kongponents](https://kongponents.konghq.com/#globally-install-all-kongponents).
- `@kong-ui-public/i18n` must be available as a `dependency` in the host application.
- `axios` must be installed as a dependency in the host application

## Usage

### Install

[See instructions for installing the `@kong-ui-public/entities-plugins` package.](../README.md#install)

### Props

#### `config`

- type: `Object as PropType<KonnectPluginFormConfig | KongManagerPluginFormConfig>`
- required: `true`
- default: `undefined`
- properties:
  - `app`:
    - type: `'konnect' | 'kongManager'`
    - required: `true`
    - default: `undefined`
    - App name.

  - `apiBaseUrl`:
    - type: `string`
    - required: `true`
    - default: `undefined`
    - Base URL for API requests.

  - `requestHeaders`:
    - type: `RawAxiosRequestHeaders | AxiosHeaders`
    - required: `false`
    - default: `undefined`
    - Additional headers to send with all Axios requests.

  - `cancelRoute`:
    - type: `RouteLocationRaw`
    - required: `true`
    - default: `undefined`
    - Route to return to when canceling creation/edit of a plugin.

  - `backRoute`:
    - type: `RouteLocationRaw`
    - required: `false`
    - default: `undefined`
    - Route to return to the plugin selection page if clicking back when creating a plugin.

  - `workspace`:
    - type: `string`
    - required: `true`
    - default: `undefined`
    - *Specific to Kong Manager*. Name of the current workspace.

  - `controlPlaneId`:
    - type: `string`
    - required: `true`
    - default: `undefined`
    - *Specific to Konnect*. Name of the current control plane.

  - `entityId`:
    - type: `string`
    - required: `false`
    - default: `''`
    - Id of the entity bound to the plugin on create/edit.

  - `entityType`:
    - type: 'consumers' | 'routes' | 'services' | 'consumer_groups' | 'plugins' (global)
    - required: `false`
    - default: `''`
    - The entity type the plugin is bound to on create/edit.

The base konnect or kongManger config.

#### `pluginType`

- type: `String`
- required: `true`

The type of plugin being created/edited.
Ex. `'acl'`

#### `pluginId`

- type: `String`
- required: `false`
- default: `''`

If showing the `Edit` type form, the ID of the plugin.

#### `hideScopeSelection`

- type: `Boolean`
- required: `false`
- default: `false`

Manually toggle visibility of plugin scope selection control.

#### `isCredential`

- type: `Boolean`
- required: `false`
- default: `false`

A boolean indicating whether the form is being used to create a plugin or an auth credential.

#### `isWizardStep`

- type: `Boolean`
- required: `false`
- default: `false`

Will hide the form buttons if you only want to render the form and want to control form submission from the consuming app.

#### `useCustomNamesForPlugin`

- type: `Boolean`
- required: `false`
- default: `false`

Support instance names for plugins. This can be removed when KHCP-5872-custom-names-for-plugins is removed. Enabled by default for KM.

### Events

#### error

An `@error` event is emitted when form validation fails. The event payload is the response error.

#### fetch-schema:error

An `@fetch-schema:error` event is emitted when attempting to fetch the plugin schema fails. The event payload is the response error.

#### loading

A `@loading` event is emitted when loading state changes. The event payload is a boolean.

#### update

An `@update` event is emitted when the form is saved. The event payload is the plugin object.

#### model-updated

A `@model-updated` event is emitted when changes are made to the form. The event payload is an object containing the form `model`, parsed `data` to be fed to the create/edit endpoint, and the `resourceEndpoint` to use for the create/edit call.

```json
{
  model: Record<string, any>,
  data: Record<string, any>,
  resourceEndpoint: string
}
```

### Usage example

Please refer to the [sandbox](../sandbox/pages/PluginListPage.vue). The form is accessible by clicking the `Edit` action of an existing plugin or after selecting a plugin when creating a new one.

## TypeScript interfaces

TypeScript interfaces [are available here](https://github.com/Kong/public-ui-components/blob/main/packages/entities/entities-plugins/src/types/plugin-form.ts) and can be directly imported into your host application. The following type interfaces are available for import:

```ts
import type {
  KonnectPluginFormConfig,
  KongManagerPluginFormConfig,
} from '@kong-ui-public/entities-plugins'
```
