# EntityEmptyState.vue

An empty state component that displays title, description, and optionally pricing, action button, learn more, and a set of features cards. Used for engaging and onboarding new users with rich information and context.

- [Requirements](#requirements)
- [Usage](#usage)
  - [Install](#install)
  - [Props](#props)
  - [Events](#events)
  - [Slots](#slots)
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
- default: `''`

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
- default: `'async () => true'`

If provided, a CTA button for creating the entity.

#### `canCreate`

- type: `() => boolean | Promise<boolean>`
- default: ``

A synchronous or asynchronous function, that returns a boolean, that evaluates if the user can create a new entity

#### `learnMore`

- type: `Boolean`
- default: `false`

If provided, will show the Learn More button for the entity.

#### `features`

- type: `Array<EmptyStateFeature>`
- default: `[]`

If provided, will display card for each feature of that entity, along with an icon slot, a title, and a short description.

### Events

#### click:create

A `@click:create` event is emitted when the CTA button is clicked.

#### click:learn-more

A `@click:learn-more` event is emitted when the Learn More button is clicked.

### Slots

#### image

Content to be displayed at the top of the component, usually an icon or image.

#### title

Content to be displayed instead of the `title` property, displayed below the image slot.

#### default

Content to be displayed instead of the `description` property, displayed below the `title`.

#### pricing

Content to be displayed instead of the `pricing` property, displayed below the `description`/default slot content.

#### message

Content to be displayed just above the action buttons.

#### actions

Content to be displayed instead of the default CTA and Learn More buttons, at the bottom of the component.

#### bottom

Content to be displayed at the bottom of the empty state component, separated by divider line.

### Usage example

Please refer to the [sandbox](../src/components/entity-empty-state/EntityEmptyState.vue).

## TypeScript interfaces

TypeScript interfaces [are available here](https://github.com/Kong/public-ui-components/blob/main/packages/entities/entities-shared/src/types/entity-empty-state.ts) and can be directly imported into your host application. The following type interfaces are available for import:

```ts
import type { EmptyStateFeature } from '@kong-ui-public/entities-shared'
```
