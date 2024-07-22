# EntityToggleModal.vue

A modal component for entity toggle confirmation.

- [Features](#features)
- [Requirements](#requirements)
- [Usage](#usage)
  - [Install](#install)
  - [Props](#props)
  - [Events](#events)
  - [Usage example](#usage-example)
- [TypeScript interfaces](#typescript-interfaces)

## Features

- Configurable title and description
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

A boolean to indicate if the modal is visible.

#### `action`

- type: `'enable' | 'disable'`
- required: `true`

Define the content of the modal.

#### `entityId`

- type: `String`
- required: `true`

ID of the entity you want to toggle. Will be used to construct to request URL.


#### `entityType` and `entityName`

- type: `String`
- required: `true`

Text used to format the content, like `"Are you sure you want to ${action} the ${entityType} ${entityName}? "`.


#### `onConfirm`

- type: `Function as PropType<() => Promise<any>> | null`
- required: `false`
- default: `null`

An async function will be called after user click the "Yes" button.
The "Yes" button will entered a visualizable pending state to give user feedback and prevent user click it again.
The pending state will not exit until the Promise returned by `onConfirm` resolved or rejected.
The parent component should make sure `onConfirm` handle all errors, any unhandled error will trigger `console.error`
and parent component will NOT be notified.


### Events

#### proceed

A `@proceed` event is emitted when action button is clicked or the Enter key is pressed, and after the `onConfirm` is resolved.
The event will not be fired if `onConfirm` enters `Rejected` state.

#### cancel

A `@cancel` event is emitted when cancel/close button is clicked or the Escape key is pressed.

### Usage example

Please refer to the [sandbox](../sandbox/pages/EntityToggleModalPage.vue).

## TypeScript interfaces

Currently we don't have any typescript interfaces exported from this component
