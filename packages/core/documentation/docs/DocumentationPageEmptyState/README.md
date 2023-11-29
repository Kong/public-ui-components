# DocumentationPageEmptyState

This component displays the empty state content when no documents exist.

- [Requirements](#requirements)
- [Usage](#usage)
  - [Install](#install)
- [Props](#props)
  - [`canEdit`](#canedit)
- [Events](#events)
  - [`create-documentation`](#create-documentation)

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
<DocumentationPageEmptyState
  v-if="documentList && !documentList.length"
  :can-edit="canEdit"
  @create-documentation="handleAddClick"
/>
```

## Props

### `canEdit`

- Type: Function
- Required: false
- Default: async () => false
- Use: Permission check for the `DocumentationDisplay` component for allowing CRUD actions

## Events

### `create-documentation`

- Triggered when the `+ New Page` button is clicked
- Host apps should hook into this event to handle displaying the `ProductDocumentModal` component
- `args` emitted with event: none
