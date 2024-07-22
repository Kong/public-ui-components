# EntityLink.vue

A link component that displays label text, and optionally links to an absolute URL. Used for navigation between micro-frontends.

- [Requirements](#requirements)
- [Usage](#usage)
  - [Install](#install)
  - [Props](#props)
  - [Usage example](#usage-example)
- [TypeScript interfaces](#typescript-interfaces)

## Requirements

- `vue` must be initialized in the host application
- `@kong/kongponents` must be added as a `dependency` in the host application, globally available via the Vue Plugin installation, and the package's style imports must be added in the app entry file. [See here for instructions on installing Kongponents](https://kongponents.konghq.com/#globally-install-all-kongponents).

## Usage

### Install

[See instructions for installing the `@kong-ui-public/entities-shared` package.](../README.md#install)

### Props

#### `entityLinkData`

- type: `Object as PropType<EntityLinkData>`
- required: `true`

Metadata associated with the link.

#### `externalLink`

- type: `String`
- required: `false`
- default: `''`

The absolute URL to be used as the `href` attribute.

#### `newWindow`

- type: `Boolean`
- required: `false`
- default: `false`

If `true`, the link will open in a new window. Otherwise, it will open in the same window.

#### `allowCopy`

- type: `Boolean`
- required: `false`
- default: `false`

If `true`, an adjacent tooltip will show, enabling a copy action of the `EntityLinkData` metadata object's `id`.

### Usage example

Please refer to the [sandbox](../src/components/entity-link/EntityLink.vue).

## TypeScript interfaces

TypeScript interfaces [are available here](https://github.com/Kong/public-ui-components/blob/main/packages/entities/entities-shared/src/types/entity-link.ts) and can be directly imported into your host application. The following type interfaces are available for import:

```ts
import type { EntityLinkData } from '@kong-ui-public/entities-shared'
```
