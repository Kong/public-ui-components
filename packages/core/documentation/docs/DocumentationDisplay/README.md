# @kong-ui-public/documentation

This component displays a selected document.

- [Requirements](#requirements)
- [Usage](#usage)
  - [Install](#install)
- [Props](#props)
  - [`canEdit`](#canedit)
  - [`hidePublishToggle`](#hidepublishtoggle)
  - [`isCard`](#iscard)
  - [`selectedDocument`](#selecteddocument)
- [Events](#events)
  - [`add-clicked`](#add-clicked)
  - [`edit-clicked`](#edit-clicked)
  - [`toggle-published`](#toggle-published)

## Requirements

- `vue` must be initialized in the host application
- `@kong/kongponents` must be available as a `dependency` in the host application, along with the package's style imports. [See here for instructions on installing Kongponents](https://kongponents.konghq.com/#globally-install-all-kongponents).

## Usage

### Install

Install the component in your host application

```sh
yarn add @kong-ui-public/documentation
```

```jsx
<DocumentationDisplay
  v-if="selectedDocument"
  :key="key"
  :can-edit="canEdit"
  class="documentation-display"
  :hide-publish-toggle="hidePublishToggle"
  :is-card="isCard"
  :selected-document="selectedDocument"
  @add-clicked="handleAddClick"
  @edit-clicked="handleEditClick"
  @toggle-published="handleTogglePublished"
/>
```

## Props

### `canEdit`

- Type: Function
- Required: false
- Default: async () => false
- Use: Permission check for allowing CRUD actions

### `hidePublishToggle`

- Type: Boolean
- Required: false
- Default: false
- Use: Hide all the `published`/`unpublished` UI components

### `isCard`

- Type: Boolean
- Required: false
- Default: false
- Use: Boolean assiting with responsive documents view

### `selectedDocument`

- Type: Object
- Required: true
- Default: N/A
- Use: Used to pass document title and status

## Events

### `add-clicked`

- Triggered when
- Host apps should hook into this event to handle displaying the `ProductDocumentModal` component
- `args` emitted with event: none

### `edit-clicked`

- Triggered when
- Host apps should hook into this event to handle displaying the `ProductDocumentModal` component
- `args` emitted with event: none

### `toggle-published`

- Triggered when the Publish/Unpublish toggle switch is clicked
- Host apps should hook into this event to handle the publish/unpublish API call
- `args` emitted with event:
  - data - boolean denoting if document is published or not
