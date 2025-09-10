# EntityBaseForm.vue

A base form component for entity create/edit views.

- [Requirements](#requirements)
- [Usage](#usage)
  - [Install](#install)
  - [Props](#props)
  - [Events](#events)
  - [Slots](#slots)
  - [Usage example](#usage-example)
- [TypeScript interfaces](#typescript-interfaces)

## Requirements

- `vue` and `vue-router` must be initialized in the host application
- `@kong/kongponents` must be added as a `dependency` in the host application, globally available via the Vue Plugin installation, and the package's style imports must be added in the app entry file. [See here for instructions on installing Kongponents](https://kongponents.konghq.com/#globally-install-all-kongponents).
- `axios` must be installed as a dependency in the host application

## Usage

### Install

[See instructions for installing the `@kong-ui-public/entities-shared` package.](../README.md#install)

### Props

#### `config`

- type: `Object as PropType<KonnectSniListConfig | KongManagerSniListConfig>`
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

  - `axiosRequestConfig`:
    - type: `AxiosRequestConfig`
    - required: `false`
    - default: `undefined`
    - An optional configuration object for the underlying Axios request.

  - `cancelRoute`:
    - type: `RouteLocationRaw`
    - required: `true`
    - default: `undefined`
    - Route to return to when canceling creation of an entity.

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

The base konnect or kongManger config.

#### `editId`

- type: `String`
- required: `false`
- default: `''`

If showing the `Edit` type form, the ID of the entity to edit.

#### `fetchUrl`

- type: `String`
- required: `false`
- default: `''`

Required if `editId` is specified.

Fetch url for the entity to edit. We will handle the replacement of {controlPlaneId}, {workspace}, and {id}.
Value should NOT contain config.apiBaseUrl, as we auto include this. Typically this will just an entry from the endpoints file.

ex. `/api/runtime_groups/{controlPlaneId}/snis/{id}`

#### `isReadonly`

- type: `Boolean`
- required: `false`
- default: `false`

A Boolean to indicate if the form is readonly. Set this prop to true during Save action. Disables the save and cancel buttons.

#### `canSubmit`

- type: `Boolean`
- required: `false`
- default: `undefined`

A Boolean to indicate if the form can be submitted. Used to track form validation, disables the save button when `false`.

#### `errorMessage`

- type: `String`
- required: `false`
- default: `''`

If form submission fails, this is the error message to display.

#### `formFields`

- type: `Object as PropType<Record<string, any>>`
- required: `true`

A record to indicate the form fields present in a form. Used to populate the Configuration JSON/YAML code blocks.

#### `wrapperComponent`

- type: `String`
- required: `false`
- default: `'KCard'`

Wrapper component to use at component's root level.

#### `saveButtonText` and `cancelButtonText`

- type: `String`
- required: `false`
- default: `undefined`

Text to display in the Save and Cancel buttons. If not provided, defaults to the localized strings for "Save" and "Cancel".

### Events

#### loading

A `@loading` event is emitted whenever the loading state changes. This is only triggered when fetching data for the edit form.

#### fetch:success

A `@fetch:success` event is only emitted when using the `Edit` type form and the GET of the entity to edit succeeded. The event payload is the entity item data object.

#### fetch:error

A `@fetch:success` event is only emitted when using the `Edit` type form and the GET of the entity to edit failed. The event payload is the AxiosError.

#### submit

A `@submit` event is emitted when the form submit button is clicked.

#### cancel

A `@cancel` event is emitted when the form cancel button is clicked.

### Slots

#### default

Content to display for the form body. Will appear above any errors or action buttons.

#### form-actions

Content to be displayed instead of the default `Cancel` and `Save` buttons, at the bottom of the form.

### Usage example

Please refer to the [sandbox](../sandbox/pages/EntityBaseFormPage.vue).

## TypeScript interfaces

TypeScript interfaces [are available here](https://github.com/Kong/public-ui-components/blob/main/packages/entities/entities-shared/src/types/entity-base-form.ts) and can be directly imported into your host application. The following type interfaces are available for import:

```ts
import type {
  BaseFormConfig,
  KonnectBaseFormConfig,
  KongManagerBaseFormConfig,
  EntityBaseFormType,
} from '@kong-ui-public/entities-shared'
```
