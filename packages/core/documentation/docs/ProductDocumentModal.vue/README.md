# @kong-ui-public/documentation

This component displays add/edit document modal.

- [Requirements](#requirements)
- [Usage](#usage)
  - [Install](#install)
- [Props](#props)
  - [`documents`](#documents)
  - [`errorMessage`](#errormessage)
  - [`hidePublishToggle`](#hidepublishtoggle)
  - [`isEditing`](#isediting)
  - [`record`](#record)
- [Events](#events)
  - [`canceled`](#canceled)
  - [`save`](#save)
  - [`delete`](#delete)

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
<ProductDocumentModal
  v-if="displayModal"
  :documents="documentList"
  :error-message="modalErrorMessage"
  :hide-publish-toggle="hidePublishToggle"
  :is-editing="isEditing"
  :record="isEditing && selectedDocument ? selectedDocument : undefined"
  @canceled="displayModal = false"
  @delete="emit('delete')"
  @save="(formData: FormData, selectedFile: any) => emit('save', formData, selectedFile)"
/>
```

## Props

### `documents`

- Type: Array
- Required: true
- Default: N/A

### `errorMessage`

- Type: String
- Required: false
- Default: ''

### `hidePublishToggle`

- Type: Boolean
- Required: false
- Default: false
- Use: Hide all the `published`/`unpublished` UI components

### `isEditing`

- Type: Boolean
- Required: false
- Default: false

### `record`

- Type: Object
- Required: false
- Default: null

## Events

### `canceled`

- Triggered when `Cancel` button is clicked
- Host apps should hook into this event to handle hiding this modal component
- `args` emitted with event: none

### `save`

- Triggered when `Save` button is clicked
- Host apps should hook into this event to handle the save document API call
- `args` emitted with event:
  - formData - the values of the input fields on the modal form. Includes:
    - fileName (string)
    - pageName (string)
    - urlSlug (string)
    - status (boolean)
    - parent (string)
  - selectedFile - the file added via the file uploader

### `delete`

- Triggered when `Delete` button is clicked.
- Host apps should hook into this event to handle the document deletion API call
- `args` emitted with event: none
