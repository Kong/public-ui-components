# @kong-ui-public/entities-key-sets

Key set entity components.

- [Requirements](#requirements)
- [Included components](#included-components)
- [Usage](#usage)
  - [Install](#install)
  - [Registration](#registration)
- [Individual component documentation](#individual-component-documentation)

## Requirements

- `vue` and `vue-router` must be initialized in the host application
- `@kong/kongponents` must be added as a dependency in the host application, globally available via the Vue Plugin installation, and the package's style imports must be added in the app entry file. [See here for instructions on installing Kongponents](https://kongponents.konghq.com/#globally-install-all-kongponents).
- `@kong-ui-public/i18n` must be available as a `dependency` in the host application.
- `axios` must be installed as a dependency in the host application

## Included components

- `KeySetList`
- `KeySetForm`
- `KeySetConfigCard`

Reference the [individual component docs](#individual-component-documentation) for more info.

## Usage

### Install

Install the component in your host application

```sh
yarn add @kong-ui-public/entities-key-sets
```

### Registration

Import the component(s) in your host application as well as the package styles

```ts
import { KeySetList, KeySetForm, KeySetConfigCard } from '@kong-ui-public/entities-key-sets'
import '@kong-ui-public/entities-key-sets/dist/style.css'
```

## Individual component documentation

- [`<KeySetList.vue />`](docs/key-set-list.md)
- [`<KeySetForm.vue />`](docs/key-set-form.md)
- [`<KeySetConfigCard.vue />`](docs/key-set-config-card.md)
