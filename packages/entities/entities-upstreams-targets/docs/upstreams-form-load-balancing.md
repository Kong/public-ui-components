# UpstreamsFormLoadBalancing.vue

A Load Balancing section of form component to create/edit Upstreams.

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

#### `algorithm`
- type: `UpstreamAlgorithm`
- required: `true`

#### `slots`
- type: `string`
- required: `true`

#### `hashOn`
- type: `UpstreamHash`
- required: `true`

#### `hashFallback`
- type: `UpstreamHash`
- required: `true`

#### `hashOnHeader`
- type: `string`
- required: `true`

#### `hashOnCookie`
- type: `string`
- required: `true`

#### `hashOnCookiePath`
- type: `string`
- required: `true`

#### `hashOnQueryArgument`
- type: `string`
- required: `true`

#### `hashOnUriCapture`
- type: `string`
- required: `true`

#### `hashFallbackHeader`
- type: `string`
- required: `true`

#### `hashFallbackQueryArgument`
- type: `string`
- required: `true`

#### `hashFallbackUriCapture`
- type: `string`
- required: `true`

#### `readonly`
[See all details](./upstreams-form-general-info.md#readonly)

### Events

#### update:algorithm
A `@update:algorithm` event is emitted when a value in the algorithm input is changed. It's used for `v-model` binding in parent component. The event payload has `UpstreamAlgorithm` type.

#### update:slots
A `@update:slots` event is emitted when a value in the slots input is changed. It's used for `v-model` binding in parent component. The event payload has `string` type.

#### update:hash-on
A `@update:hash-on` event is emitted when a value in the hashOn input is changed. It's used for `v-model` binding in parent component. The event payload has `UpstreamHash` type.

#### update:hash-fallback
A `@update:hash-fallback` event is emitted when a value in the hashFallback input is changed. It's used for `v-model` binding in parent component. The event payload has `UpstreamHash` type.

#### update:hash-on-header
A `@update:hash-on-header` event is emitted when a value in the hashOnHeader input is changed. It's used for `v-model` binding in parent component. The event payload has `string` type.

#### update:hash-on-cookie
A `@update:hash-on-cookie` event is emitted when a value in the hashOnCookie input is changed. It's used for `v-model` binding in parent component. The event payload has `string` type.

#### update:hash-on-cookie-path
A `@update:hash-on-cookie-path` event is emitted when a value in the hashOnCookiePath input is changed. It's used for `v-model` binding in parent component. The event payload has `string` type.

#### update:hash-on-query-argument
A `@update:hash-on-query-argument` event is emitted when a value in the hashOnQueryArgument input is changed. It's used for `v-model` binding in parent component. The event payload has `string` type.

#### update:hash-on-uri-capture
A `@update:hash-on-uri-capture` event is emitted when a value in the hashOnUriCapture input is changed. It's used for `v-model` binding in parent component. The event payload has `string` type.

#### update:hash-fallback-header
A `@update:hash-fallback-header` event is emitted when a value in the hashFallbackHeader input is changed. It's used for `v-model` binding in parent component. The event payload has `string` type.

#### update:hash-fallback-query-argument
A `@update:hash-fallback-query-argument` event is emitted when a value in the hashFallbackQueryArgument input is changed. It's used for `v-model` binding in parent component. The event payload has `string` type.

#### update:hash-fallback-uri-capture
A `@update:hash-fallback-uri-capture` event is emitted when a value in the hashFallbackUriCapture input is changed. It's used for `v-model` binding in parent component. The event payload has `string` type.

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