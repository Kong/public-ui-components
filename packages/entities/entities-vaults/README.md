# @kong-ui/entities-vaults

Vault entity components.

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

- `VaultList`
- `VaultForm`
- `VaultConfigCard`

Reference the [individual component docs](#individual-component-documentation) for more info.

## Usage

### Install

Install the component in your host application

```sh
yarn add @kong-ui/entities-vaults
```

### Registration

Import the component(s) in your host application as well as the package styles

```ts
import { VaultList, VaultForm, VaultConfigCard } from '@kong-ui/entities-vaults'
import '@kong-ui/entities-vaults/dist/style.css'
```

## Individual component documentation

- [`<VaultList.vue />`](docs/vault-list.md)
- [`<VaultForm.vue />`](docs/vault-form.md)
- [`<VaultConfigCard.vue />`](docs/vault-config-card.md)
