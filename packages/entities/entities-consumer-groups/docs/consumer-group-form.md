# ConsumerGroupForm.vue

A form component to create/edit Consumer Group.

- [Requirements](#requirements)
- [Usage](#usage)
    - [Install](#install)
    - [Props](#props)
    - [Events](#events)
    - [Usage example](#usage-example)
- [TypeScript interfaces](#typescript-interfaces)

## Requirements

- `vue` and `vue-router` must be initialized in the host application
- `@kong/kongponents` must be added as a `dependency` in the host application, globally available via the Vue Plugin installation, and the package's style imports must be added in the app entry file. [See here for instructions on installing Kongponents](https://kongponents.konghq.com/#globally-install-all-kongponents).
- `@kong-ui-public/i18n` must be available as a `dependency` in the host application.
- `axios` must be installed as a dependency in the host application

## Usage

### Install

[See instructions for installing the `@kong-ui-public/entities-consumer-groups` package.](../README.md#install)

### Props

#### `config`
- type: `Object as PropType<KonnectConsumerGroupFormConfig | KongManagerConsumerGroupFormConfig>`
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
        - Route to return to when canceling creation of a Consumer.

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

#### `consumerGroupId`
- type: `string`
- required: `false`
- default: `''`
- If a valid consumerGroupId is provided, it will put the form in Edit mode instead of Create.

### Events

#### update

A `@update` event is emitted when the form is saved. The event payload has `ConsumerGroupData` interface.

#### error

An `@error` event is emitted when the form fails to fetch Consumer Group data or save Consumer Group data. The event payload is the response error (interface `AxiosError`).

#### loading

A `@loading` event is emitted when loading state changes. The event payload is a boolean.

### Usage example

Please refer to the [sandbox](../sandbox/pages/ConsumerGroupFormPage.vue). The form is accessible by clicking the `+ New Consumer Group` button or `Edit` action of an existing Consumer Group.

## TypeScript interfaces

TypeScript interfaces [are available here](https://github.com/Kong/public-ui-components/blob/main/packages/entities/entities-consumer-groups/src/types/consumer-group-form.ts) and can be directly imported into your host application. The following type interfaces are available for import:

```ts
import type {
 BaseConsumerGroupFormConfig,
 KonnectConsumerGroupFormConfig,
 KongManagerConsumerGroupFormConfig,
 ConsumerGroupFields,
 ConsumerGroupPayload,
 ConsumerGroupState,
 Consumer,
 ConsumerGroupActions,
 ConsumerGroupData,
} from '@kong-ui-public/entities-consumer-groups'
```