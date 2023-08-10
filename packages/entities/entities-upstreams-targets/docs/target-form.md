# TargetForm.vue

A form component for targets. Comes with [`TargetsList` component](../src/components/TargetsList.vue) out of the box, but can also be imported as a standalone component. Comes in a modal.

- [Requirements](#requirements)
- [Usage](#usage)
  - [Install](#install)
  - [Props](#props)
  - [Slots](#slots)
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

[See instructions for installing the `@kong-ui-public/entities-upstreams-targets` package.](../README.md#install)

### Props

#### `config`

- type: `Object as PropType<KonnectTargetFormConfig | KongManagerTargetFormConfig>`
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

  - `upstreamId`:
    - type: `string`
    - required: `true`
    - default: `undefined`
    - ID of the upstream.

The base konnect or kongManger config.

#### `isVisible`

- type: `Boolean`
- required: `true`
- default: `false`

Controls whether the form modal is visible or not.

#### `targetId`

- type: `String`
- required: `false`
- default: `''`

ID of the edited target. If present, the form is `Edit` [type](../../entities-shared/src/types/entity-base-form.ts#L17).

### Slots

#### info

Slot for content above the input fields.

### Events

#### error

An `@error` event is emitted when form validation fails. The event payload is the response error.

#### loading

A `@loading` event is emitted when loading state changes. The event payload is a boolean.

#### update

A `@update` event is emitted when the form is saved successfully. The event payload is the target object.

#### cancel

A `@cancel` event is emitted when cancel or the cross icon at the top of the modal is clicked.

### Usage example

Please refer to the [`TargetsList` component](../src/components/TargetsList.vue). The form is accessible by clicking the `+ New Target` button. Comes with `TargetsList` out of the box, but can also be used independently.

## TypeScript interfaces

TypeScript interfaces [are available here](../src/types/target-form.ts) and can be directly imported into your host application. The following type interfaces are available for import:

```ts
import type {
  BaseTargetFormConfig
  KonnectTargetFormConfig,
  KongManagerTargetFormConfig,
} from '@kong-ui-public/entities-upstreams-targets'
```
