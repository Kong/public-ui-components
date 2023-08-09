# @kong-ui/entities-keys

Key entity components.

- [Requirements](#requirements)
- [Included components](#included-components)
- [Usage](#usage)
  - [Install](#install)
  - [Registration](#registration)
- [Individual component documentation](#individual-component-documentation)

## Requirements

- `vue` and `vue-router` must be initialized in the host application
- `@kong/kongponents` must be added as a dependency in the host application, globally available via the Vue Plugin installation, and the package's style imports must be added in the app entry file. [See here for instructions on installing Kongponents](https://kongponents.konghq.com/#globally-install-all-kongponents).
- `@kong-ui-public/copy-uuid` must be available as a `dependency` in the host application, globally available via the Vue Plugin installation, and the package's style imports must be added in the app entry file.
- `@kong-ui-public/i18n` must be available as a `dependency` in the host application.
- `axios` must be installed as a dependency in the host application

## Included components

- `KeyList`
- `KeyForm`
- `KeyConfigCard`

Reference the [individual component docs](#individual-component-documentation) for more info.

## Usage

### Install

Install the component in your host application

```sh
yarn add @kong-ui/entities-keys
```

### Registration

Import the component(s) in your host application as well as the package styles

```ts
import { KeyList, KeyForm, KeyConfigCard } from '@kong-ui/entities-keys'
import '@kong-ui/entities-keys/dist/style.css'
```

## Individual component documentation

- [`<KeyList.vue />`](docs/key-list.md)
- [`<KeyForm.vue />`](docs/key-form.md)
- [`<KeyConfigCard.vue />`](docs/key-config-card.md)
