# @kong-ui-public/entities-redis-configurations

Redis Configuration components.

- [Requirements](#requirements)
- [Included components](#included-components)
- [Usage](#usage)
  - [Install](#install)
  - [Registration](#registration)

## Requirements

- `vue` and `vue-router` must be initialized in the host application.
- `@kong/kongponents` must be added as a dependency in the host application, globally available via the Vue Plugin installation, and the package's style imports must be added in the app entry file. [See here for instructions on installing Kongponents](https://kongponents.konghq.com/#globally-install-all-kongponents).
- `@kong-ui-public/i18n` must be available as a `dependency` in the host application.
- `@kong-ui-public/entities-shared` must be available as a `dependency` in the host application.
- `@kong-ui-public/entities-vaults` must be available as a `dependency` in the host application.
- `axios` must be installed as a dependency in the host application.

## Included components

- [`RedisConfigurationForm`](docs/redis-configuration-form.md)
- [`RedisConfigurationList`](docs/redis-configuration-list.md)
- [`RedisConfigurationConfigCard`](docs/redis-configuration-config-card.md)

## Usage

### Install

Install the component in your host application

```sh
pnpm add @kong-ui-public/entities-redis-configurations
```

### Registration

Import the component(s) in your host application as well as the package styles

```ts
import {
  RedisConfigurationForm,
  RedisConfigurationList,
  RedisConfigurationConfigCard,
} from '@kong-ui-public/entities-redis-configurations'

import '@kong-ui-public/entities-redis-configurations/dist/style.css'

// `RedisConfigurationForm` only
import '@kong-ui-public/entities-shared/dist/style.css'
import '@kong-ui-public/entities-vaults/dist/style.css'
```
