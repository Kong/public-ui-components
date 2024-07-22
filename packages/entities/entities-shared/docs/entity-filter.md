# EntityFilter.vue

A filter component for filtering entities.

- [Requirements](#requirements)
- [Usage](#usage)
    - [Install](#install)
    - [Props](#props)
    - [Events](#events)
    - [Usage example](#usage-example)
- [TypeScript interfaces](#typescript-interfaces)

## Requirements

- `vue` must be initialized in the host application
- `@kong/kongponents` must be added as a `dependency` in the host application, globally available via the Vue Plugin installation, and the package's style imports must be added in the app entry file. [See here for instructions on installing Kongponents](https://kongponents.konghq.com/#globally-install-all-kongponents).

## Usage

### Install

[See instructions for installing the `@kong-ui-public/entities-shared` package.](../README.md#install)

### Props

#### `modelValue`

- type: `String`
- required: `true`
- default: `''`

Value of the query string.

#### `config`

- type: `Object as PropType<ExactMatchFilterConfig | FuzzyMatchFilterConfig>`
- required: `true`
- default: `{ isExactMatch: true, placeholder: '' }`

Filter configuration:
- For exact match, the config should have a shape of `ExactMatchFilterConfig`:
    - `isExactMatch`: `true`
    - `placeholder`: `string`
- For fuzzy match, the config should have a shape of `FuzzyMatchFilterConfig`:
    - `isExactMatch`: `false`
    - `fields`: `FilterFields`
    - `schema`: `FilterSchema`

### Events

#### update:modelValue

- For exact match, an `update:modelValue` event is emitted when the user types in the input box. The event payload is the value of the input.
- For fuzzy match, an `update:modelValue` event is emitted when the user clicks one of the `Apply`, `Clear` or `Clear all filters` buttons. The event payload is a string representing the filter values.

### Usage example

Please refer to the [sandbox](../sandbox/pages/EntityFilterPage.vue).

## TypeScript interfaces

TypeScript interfaces [are available here](https://github.com/Kong/public-ui-components/blob/main/packages/entities/entities-shared/src/types/entity-filter.ts) and can be directly imported into your host application. The following type interfaces are available for import:

```ts
import type {
  FilterFields,
  FilterSchema,
  ExactMatchFilterConfig,
  FuzzyMatchFilterConfig,
} from '@kong-ui-public/entities-shared'
```
