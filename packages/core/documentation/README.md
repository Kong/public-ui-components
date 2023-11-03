# @kong-ui-public/documentation

A set of Kong UI components for displaying documents.

- [Features](#features)
- [Requirements](#requirements)
- [Components](#components)
- [Usage](#usage)
  - [Install](#install)

## Features

- List of package features

## Requirements

- `vue` must be initialized in the host application
- `@kong/kongponents` must be available as a `dependency` in the host application, along with the package's style imports. [See here for instructions on installing Kongponents](https://kongponents.konghq.com/#globally-install-all-kongponents).

## Components

- `DocumentationContent`
  - Props
    - `cacheKey`
      - Type: Number
      - Required: false
      - Default: 0
    - `canEdit`
      - Type: Function
      - Required: false
      - Default: async () => false
    - `documentList`
      - Type: Array
      - Required: true
      - Default: N/A
    - `documentResponse`
      - Type: Object
      - Required: true
      - Default: N/A
    - `entityId`
      - Type: String
      - Required: true
      - Default: N/A
    - `isCard`
      - Type: Boolean
      - Required: false
      - Default: false
    - `selectedDocument`
      - Type: Object
      - Required: false
      - Default: async () => null
  - Events
    - `child-change`
      - Triggered when a child document is moved (drag 'n drop)
      - Host apps should hook into this event to handle the move API call
      - `args` emitted with event:
        - data - the childChangeEvent
    - `create`
      - Triggered when `Add Page` button is clicked
      - Host apps should hook into this event to handle displaying the `ProductDocumentModal` component
      - `args` emitted with event: none
    - `document-selection`
      - Triggered when document is selected
      - Host apps should hook into this event to handle the get document API call and routing to the clicked document
      - `args` emitted with event: none
    - `edit`
      - Triggered when `Edit` button is clicked
      - Host apps should hook into this event to handle displaying the `ProductDocumentModal` component
      - `args` emitted with event: none
    - `parent-change`
      - Triggered when a parent document is moved (drag 'n drop)
      - Host apps should hook into this event to handle the move API call
      - `args` emitted with event:
        - data - the changeEvent
    - `toggle-published`
      - Triggered when the Publish/Unpublish toggle switch is clicked
      - Host apps should hook into this event to handle the publish/unpublish API call
      - `args` emitted with event:
        - data - boolean denoting if document is published or not

- `DocumentationDisplay`
  - Props
    - `canEdit`
      - Type: Function
      - Required: false
      - Default: async () => false
    - `documentResponse`
      - Type: Object
      - Required: true
      - Default: N/A
    - `isCard`
      - Type: Boolean
      - Required: false
      - Default: false
    - `record`
      - Type: Object
      - Required: true
      - Default: N/A
  - Events
    - `add-clicked`
      - Triggered when
      - Host apps should hook into this event to handle displaying the `ProductDocumentModal` component
      - `args` emitted with event: none
    - `edit-clicked`
      - Triggered when
      - Host apps should hook into this event to handle displaying the `ProductDocumentModal` component
      - `args` emitted with event: none
    - `toggle-published`
      - Triggered when the Publish/Unpublish toggle switch is clicked
      - Host apps should hook into this event to handle the publish/unpublish API call
      - `args` emitted with event:
        - data - boolean denoting if document is published or not

- `DocumentationPageEmptyState`
  - Props
    - `canEdit`
      - Type: Function
      - Required: false
      - Default: async () => false
  - Events
    - `create-documentation`
      - Triggered when the `+ New Page` button is clicked
      - Host apps should hook into this event to handle displaying the `ProductDocumentModal` component
      - `args` emitted with event: none

- `ProductDocumentModal`
  - Props
    - `showModal`
      - Type: Boolean
      - Required: false
      - Default: false
    - `record`
      - Type: Object
      - Required: false
      - Default: null
    - `isEditing`
      - Type: Boolean
      - Required: false
      - Default: false
    - `documents`
      - Type: Array
      - Required: true
      - Default: N/A
    - `errorMessage`
      - Type: String
      - Required: false
      - Default: ''
  - Events
    - `canceled`
      - Triggered when `Cancel` button is clicked
      - Host apps should hook into this event to handle hiding this modal component
      - `args` emitted with event: none
    - `save`
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
    - `delete`
      - Triggered when `Delete` button is clicked.
      - Host apps should hook into this event to handle the document deletion API call
      - `args` emitted with event: none

## Usage

### Install

Install the component in your host application

```sh
yarn add @kong-ui-public/documentation
```

```jsx
<DocumentationPageEmptyState
  v-if="!hasData"
  :can-edit="isAllowedEdit"
  @create-documentation="handleCreate"
/>

<DocumentationContent
  v-else
  :cache-key="cacheKey"
  :can-edit="isAllowedEdit"
  :document-list="documentList"
  :document-response="documentResponse"
  :entity-id="serviceId"
  :is-card="false"
  :selected-document="selectedDocument"
  @child-change="handleChildChange"
  @create="handleCreate"
  @document-selection="handleDocumentSelection"
  @edit="handleEdit"
  @parent-change="handleParentChange"
  @toggle-publish="handlePublishToggle"
/>
```

```jsx
<ProductDocumentModal
  :documents="documents"
  :error-message="modalErrorMessage"
  :is-editing="isEditing"
  :record="selectedDocument"
  :show-modal="showModal"
  @canceled="handleCancel"
  @delete="handleDelete"
  @save="handleSave"
/>
```
