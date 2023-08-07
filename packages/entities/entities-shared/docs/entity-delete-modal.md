# EntityDeleteModal.vue

A modal component for entity delete confirmation.

- [Features](#features)
- [Requirements](#requirements)
- [Usage](#usage)
  - [Install](#install)
  - [Props](#props)
  - [Events](#events)
  - [Slots](#slots)
  - [Usage example](#usage-example)
- [TypeScript interfaces](#typescript-interfaces)

## Features

- Configurable title and description
- Optional confirmation text input
- Pending state for the confirmation button

## Requirements

- `vue` and `vue-router` must be initialized in the host application
- `@kong/kongponents` must be added as a `dependency` in the host application, globally available via the Vue Plugin installation, and the package's style imports must be added in the app entry file. [See here for instructions on installing Kongponents](https://kongponents.konghq.com/#globally-install-all-kongponents).

## Usage

### Install

[See instructions for installing the `@kong-ui-public/entities-shared` package.](../README.md#install)

### Props

#### `visible`

- type: `Boolean`
- required: `true`
- default: `false`

A boolean to indicate if the modal is visible.

#### `title`

- type: `String`
- required: `false`
- default: `'Delete'`

A string to display in the modal header.

#### `description`

- type: `String`
- required: `false`
- default: `''`

A string to display in the modal body, under the main message.

#### `entityType`

- type: `String as PropType<EntityTypes>`
- required: `true`
- default: `'entity'`

Type of the entity. e.g. `'service'`, `'route'`.

#### `entityName`

- type: `String`
- required: `false`
- default: `''`

Name of the entity.

#### `actionPending`

- type: `Boolean`
- required: `false`
- default: `false`

A Boolean to indicate if an action is being taken and the action button is disabled.

#### `error`

- type: `String`
- required: `false`
- default: `''`

The error message to display, inside a `KAlert`, at the top of the prompt. If `undefined` or an empty string, the error will not be shown.

### Events

#### proceed

A `@proceed` event is emitted when action button is clicked or the Enter key is pressed.

#### cancel

A `@cancel` event is emitted when cancel/close button is clicked or the Escape key is pressed.

### Slots

#### description

Content to display in the modal body, under the main message. The preferred pattern is to use the `description` prop, but if you need to format the text with HTML use this slot.

### Usage example

Please refer to the [sandbox](../sandbox/pages/EntityDeleteModalPage.vue).

## TypeScript interfaces

TypeScript interfaces [are available here](https://github.com/Kong/public-ui-components/blob/main/packages/entities/entities-shared/src/types/entity-delete-modal.ts) and can be directly imported into your host application. The following type interfaces are available for import:

```ts
import type { EntityTypes } from '@kong-ui-public/entities-shared'
```
