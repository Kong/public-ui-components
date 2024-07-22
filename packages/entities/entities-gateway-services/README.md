# @kong-ui-public/entities-gateway-services

Gateway Service entity components.

- [Requirements](#requirements)
- [Included components](#included-components)
- [Usage](#usage)
  - [Install](#install)
  - [Registration](#registration)
- [Individual component documentation](#individual-component-documentation)

## Requirements

Check the [individual component docs](#individual-component-documentation) for more info.

## Included components

- `GatewayServiceList`
- `GatewayServiceForm`
- `GatewayServiceConfigCard`

Reference the [individual component docs](#individual-component-documentation) for more info.

## Usage

### Install

Install the component in your host application

```sh
yarn add @kong-ui-public/entities-gateway-services
```

### Registration

Import the component(s) in your host application as well as the package styles

```ts
import { GatewayServiceList, GatewayServiceForm, GatewayServiceConfigCard } from '@kong-ui-public/entities-gateway-services'
import '@kong-ui-public/entities-gateway-services/dist/style.css'
```

## Individual component documentation

- [`<GatewayServiceList.vue />`](docs/gateway-service-list.md)
- [`<GatewayServiceForm.vue />`](docs/gateway-service-form.md)
- [`<GatewayServiceConfigCard.vue />`](docs/gateway-service-config-card.md)
