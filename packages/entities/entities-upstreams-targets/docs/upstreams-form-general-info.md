# UpstreamsFormGeneralInfo.vue

A General info section of form component to create/edit Upstreams.

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

[See instructions for installing the `@kong-ui-public/entities-upstreams-tagrets` package.](../README.md#install)

### Props

#### `config`
[See all properties](./upstreams-form.md#config)

#### `name`
- type: `string`
- required: `true`

#### `hostHeader`
- type: `string`
- required: `true`

#### `clientCertificate`
- type: `string`
- required: `true`

#### `tags`
- type: `string`
- required: `true`

#### `readonly`
- type: `boolean`
- required: `false`
- default: `false`

### Events

#### update:name
A `@update:name` event is emitted when a value in the name input is changed. It's used for `v-model` binding in parent component. The event payload has `string` type.

#### update:host-header
A `@update:host-header` event is emitted when a value in the hostHeader input is changed. It's used for `v-model` binding in parent component. The event payload has `string` type.

#### update:client-certificate
A `@update:client-certificate` event is emitted when a value in the clientCertificate input is changed. It's used for `v-model` binding in parent component. The event payload has `string` type.

#### update:tags
A `@update:tags` event is emitted when a value in the tags input is changed. It's used for `v-model` binding in parent component. The event payload has `string` type.

### Usage example

Please refer to the [sandbox](../sandbox/pages/UpstreamFormPage.vue). The form is accessible by clicking the `+ New Upstream` button or `Edit` action of an existing Upstream. 

## TypeScript interfaces

TypeScript interfaces [are available here](https://github.com/Kong/public-ui-components/blob/main/packages/entities/entities-upstreams-targets/src/types/upstreams-form.ts) and can be directly imported into your host application. The following type interfaces are available for import:
```ts
import type {
 BaseUpstreamsFormConfig,
 KonnectUpstreamsFormConfig,
 KongManagerUpstreamsFormConfig,
 UpstreamAlgorithm,
 UpstreamHash,
 HealthCheckType,
 ActiveHealthCheckHeader,
 ActiveHealthCheck,
 PassiveHealthCheck,
 UpstreamFormFields,
 UpstreamFormState,
 AlgorithmSelectItem,
 HashSelectItem,
 HealthCheckTypeSelectItem,
 MultiselectComposableOptions,
 UpstreamFormPayload,
 UpstreamResponse,
 UpstreamsFormActions,
} from '@kong-ui-public/entities-upstreams-targets'
```