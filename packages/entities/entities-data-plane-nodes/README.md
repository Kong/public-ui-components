# @kong-ui-public/entities-data-plane-nodes

Data Plane entity components.

- [Requirements](#requirements)
- [Included types](#included-types)
- [Included components](#included-components)
- [Usage](#usage)
  - [Install](#install)
  - [Registration](#registration)
- [Individual component documentation](#individual-component-documentation)

## Requirements

Check the [individual component docs](#individual-component-documentation) for more info.

## Included types

- `LogLevel` - An enum representing the log levels available for Data Plane nodes.
- `ChangeLogLevelConfig` - The config union (`konnect` / `kongManager`) accepted by `ChangeLogLevelModal`.

## Included components

- `ChangeLogLevelModal` - A modal used to change the log level for a group of Data Plane nodes.

Reference the [individual component docs](#individual-component-documentation) for more info.

## Usage

### Install

Install the component in your host application

```sh
yarn add @kong-ui-public/entities-data-plane-nodes
```

### Registration

Import the component(s) in your host application as well as the package styles

```ts
import { ChangeLogLevelModal, composables } from '@kong-ui-public/entities-data-plane-nodes'
import '@kong-ui-public/entities-data-plane-nodes/dist/style.css'
```

## Individual component documentation

- [`<ChangeLogLevelModal.vue />`](docs/change-log-level-modal.md)
