# @kong-ui-public/entities-shared

Shared components for Kong entities.

- [Features](#features)
- [Requirements](#requirements)
- [Included components](#included-components)
- [Included composables](#included-composables)
- [Usage](#usage)
  - [Install](#install)
  - [Registration](#registration)
- [Individual component documentation](#individual-component-documentation)
- [Individual composables documentation](#individual-composables-documentation)
- [Sandbox shared utilities](#sandbox-shared-utilities)

## Features

- Modal component for entity toggle confirmation ([see the EntityToggleModal docs for more info](docs/entity-toggle-modal.md))
- Modal component for entity delete confirmation ([see the EntityDeleteModal docs for more info](docs/entity-delete-modal.md))
- Base table component for entity list views ([see the EntityBaseTable docs for more info](docs/entity-base-table.md))
- Filter component for filtering entities ([see the EntityFilter docs for more info](docs/entity-filter.md))

## Requirements

- `vue` and `vue-router` must be initialized in the host application
- `@kong/kongponents` must be added as a `dependency` in the host application, globally available via the Vue Plugin installation, and the package's style imports must be added in the app entry file. [See here for instructions on installing Kongponents](https://kongponents.konghq.com/#globally-install-all-kongponents).
- `@kong-ui-public/i18n` must be available as a `dependency` in the host application.
- `axios` must be installed as a dependency in the host application

## Included components

- `EntityDeleteModal`
- `EntityBaseTable`
- `EntityBaseForm`
- `EntityFilter`
- `PermissionsWrapper`
- `EntityFormSection`
- `EntityToggleModal`
- `EntityBaseConfigCard`

Reference the [individual component docs](#individual-component-documentation) for more info.

## Included composables

- `useAxios`

Reference the [individual composables docs](#individual-composables-documentation) for more info.

## Usage

### Install

Install the component in your host application

```sh
yarn add @kong-ui-public/entities-shared
```

> **Note**: If you are installing `@kong-ui-public/entities-shared` into another package within this repository, you will need to build it first before attempting to run locally with `pnpm --filter="@kong-ui-public/entities-shared" run build`.

### Registration

Import the component in your host application

```ts
import { EntityDeleteModal, EntityBaseTable } from '@kong-ui-public/entities-shared'
import '@kong-ui-public/entities-shared/dist/style.css'
```

## Individual component documentation

- [`<EntityDeleteModal.vue />`](docs/entity-delete-modal.md)
- [`<EntityBaseTable.vue />`](docs/entity-base-table.md)
- [`<EntityBaseForm.vue />`](docs/entity-base-form.md)
- [`<EntityFilter.vue />`](docs/entity-filter.md)
- [`<PermissionsWrapper.vue />`](docs/permissions-wrapper.md)
- [`<EntityFormSection.vue />`](docs/entity-form-section.md)
- [`<EntityToggleModal.vue />`](docs/entity-toggle-modal.md)
- [`<EntityBaseConfigCard.vue />`](docs/entity-base-config-card.md)

## Individual composables documentation

- [`useAxios`](docs/use-axios.md)

## Sandbox shared utilities

The individual entities sandboxes all share some common components/utilities which lives in the `/packages/entities/entities-shared/sandbox/shared` folder and can be imported via the `@entities-shared-sandbox/...` alias. Those components **are not** getting exported by the package and are only available in "dev" environment.

[Docs](https://github.com/Kong/public-ui-components/blob/main/packages/entities/entities-shared/sandbox/shared/docs/sandbox-shared.md).
