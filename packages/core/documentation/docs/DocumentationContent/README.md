# @kong-ui-public/documentation

The main Kong UI component for display documentation.

- [Features](#features)
- [Requirements](#requirements)
- [Usage](#usage)
  - [Install](#install)
- [Props](#props)
  - [`actionPending`](#actionpending)
  - [`actionSuccess`](#actionsuccess)
  - [`cacheKey`](#cachekey)
  - [`canEdit`](#canedit)
  - [`documentList`](#documentlist)
  - [`entityId`](#entityid)
  - [`hidePublishToggle`](#hidepublishtoggle)
  - [`card`](#card)
  - [`modalErrorMessage`](#modalerrormessage)
  - [`selectedDocument`](#selecteddocument)
- [Events](#events)
  - [`child-change`](#child-change)
  - [`delete`](#delete)
  - [`document-selection`](#document-selection)
  - [`modal-closed`](#modal-closed)
  - [`parent-change`](#parent-change)
  - [`save`](#save)
  - [`toggle-published`](#toggle-published)

## Features

`DocumentationContent` is the main documentation component host apps should consume. It bundles the `KTreeList`, `DocumentationDisplay` and `ProductDocumentModal` components making it easy to add a fully-featured documentation component to any consuming application.

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
<DocumentationContent
  :action-pending="actionPending"
  :action-success="actionSuccess"
  :cache-key="cacheKey"
  :can-edit="isAllowed"
  :document-list="documentList"
  :entity-id="serviceId"
  hide-publish-toggle
  :is-card="false"
  :modal-error-message="modalErrorMessage"
  :selected-document="selectedDocument"
  @child-change="handleChildChange"
  @delete="handleDelete"
  @document-selection="handleDocSelection"
  @modal-closed="actionSuccess = false"
  @parent-change="handleParentChange"
  @save="handleSave"
/>
```

## Props

### `actionPending`

- Type: Boolean
- Required: false
- Default: false
- Use: Signal to `ProductDocumentModal` component that an action is pending. Allows the component to show loading state.

### `actionSuccess`

- type: Boolean
- Required: false
- Default: false
- Use: Signal to the `ProductDocumentModal` component that an action was successful and we should close the modal

### `cacheKey`

- Type: Number
- Required: false
- Default: 0
- Use: Used to make `key` attribute dynamic for the `KTreeList` and `DocumentationDisplay` components. The key special attribute is primarily used as a hint for Vue's virtual DOM algorithm to identify vnodes when diffing the new list of nodes against the old list.

### `canEdit`

- Type: Function
- Required: false
- Default: async () => false
- Use: Permission check for the `DocumentationDisplay` component for allowing CRUD actions

### `documentList`

- Type: Array
- Required: true
- Default: N/A
- Use: The list of document items passed into the `items` prop of the `KTreeList` component

### `entityId`

- Type: String
- Required: true
- Default: N/A
- Use: The ID of the entity to which a document is associated. Examples are API Product ID, Service ID etc.

### `hidePublishToggle`

- Type: Boolean
- Required: false
- Default: false
- Use: Hide all the `published`/`unpublished` UI components

### `card`

- Type: Boolean
- Required: false
- Default: false
- Use: Boolean assiting with responsive documents view

### `modalErrorMessage`

- Type: String
- Required: false
- Default: false
- Use: Display and error message on the `ProductDocumentModal` if an action failed

### `selectedDocument`

- Type: Object
- Required: false
- Default: async () => null
- Use: Denotes which document has been selected

## Events

### `child-change`

- Triggered when a child document is moved (drag 'n drop)
- Host apps should hook into this event to handle the move API call
- `args` emitted with event:
  - data - the childChangeEvent

### `delete`

- Triggered when the delete button is clicked
- Host apps should hook into this even tto handle the delete document API call
- `args` emitted with event: none

### `document-selection`

- Triggered when document is selected
- Host apps should hook into this event to handle the get document API call and routing to the clicked document
- `args` emitted with event: none

### `modal-closed`

- Triggered when the modal is closed
- Host apps should hook into this event to set the value for the `actionSuccess` prop to `false`
- `args` emitted with event: none

### `parent-change`

- Triggered when a parent document is moved (drag 'n drop)
- Host apps should hook into this event to handle the move API call
- `args` emitted with event:
  - data - the changeEvent

### `save`

- Triggered when the save button is clicked on the `ProductDocumentModal` component
- Host apps should hook into this event to handle the save document API call
- `args` emitted with this event
  - formData - the form data from the `ProductDocumentModal` component
  - selectedFile - the selected file

### `toggle-published`

- Triggered when the Publish/Unpublish toggle switch is clicked
- Host apps should hook into this event to handle the publish/unpublish API call
- `args` emitted with event:
  - data - boolean denoting if document is published or not
