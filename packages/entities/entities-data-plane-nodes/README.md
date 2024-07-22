# @kong-ui-public/entities-data-plane-nodes

Data Plane entity components.

- [Requirements](#requirements)
- [Included types](#included-types)
- [Included components](#included-components)
- [Included composables](#included-composables)
- [Usage](#usage)
  - [Install](#install)
  - [Registration](#registration)
- [Individual component documentation](#individual-component-documentation)
- [Individual composables documentation](#individual-composables-documentation)

## Requirements

Check the [individual component docs](#individual-component-documentation) for more info.

## Included types

- `LogLevel` - An enum representing the log levels available for Data Plane nodes.

## Included components

- `ChangeLogLevelModal` - A modal used to change the log level for a group of Data Plane nodes.

Reference the [individual component docs](#individual-component-documentation) for more info.

## Included composables

- `useDataPlaneLogLevelChecker`
- `useAsyncScheduler`

Reference the [individual composables docs](#individual-composables-documentation) for more info.

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

import type { LogLevel } from '@kong-ui-public/entities-data-plane-nodes'
```

## Individual component documentation

- [`<ChangeLogLevelModal.vue />`](docs/change-log-level-modal.md)


## Individual composables documentation

- [`useDataPlaneLogLevelChecker`](docs/use-data-plane-log-level-checker.md)
- [`useAsyncScheduler`](docs/use-async-scheduler.md)
