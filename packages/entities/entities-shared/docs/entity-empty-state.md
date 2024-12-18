# EntityEmptyState.vue

An empty state component that displays title, description, and optionally pricing, action button, learn more, and a set of features cards. Used for engaging and onboarding new users with rich information and context.

- [Requirements](#requirements)
- [Usage](#usage)
  - [Install](#install)
  - [Props](#props)
  - [Usage example](#usage-example)
- [TypeScript interfaces](#typescript-interfaces)

## Requirements

- `vue` must be initialized in the host application
- `@kong/kongponents` must be added as a `dependency` in the host application, globally available via the Vue Plugin installation, and the package's style imports must be added in the app entry file. [See here for instructions on installing Kongponents](https://kongponents.konghq.com/#globally-install-all-kongponents).

## Usage

### Install

[See instructions for installing the `@kong-ui-public/entities-shared` package.](../README.md#install)

### Props

#### `title`

- type: `String`
- required: `true`

Title for the empty state.

#### `description`

- type: `String`
- default: `''`

Description for the empty state.

#### `pricing`

- type: `String`
- default: `''`

If provided, will display pricing information.

#### `actionButtonText`

- type: `String`
- default: ``

If provided, a CTA button will show with text and icon typically, for creating an entity.

#### `learnMoreLink`

- type: `Boolean`
- default: `false`

If provided, will show the Learning Hub button for the entity.

#### `features`

- type: `Array<EmptyStateFeature>`
- default: `[]`

If provided, will display card for each feature of that entity, along with an icon slot, a title, and a short description.

### Usage example

Please refer to the [sandbox](../src/components/entity-empty-state/EntityEmptyState.vue).

## TypeScript interfaces

TypeScript interfaces [are available here](https://github.com/Kong/public-ui-components/blob/main/packages/entities/entities-shared/src/types/entity-empty-state.ts) and can be directly imported into your host application. The following type interfaces are available for import:

```ts
import type { EmptyStateFeature } from '@kong-ui-public/entities-shared'
```
