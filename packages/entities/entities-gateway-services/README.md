# @kong-ui-public/entities-gateway-services

Gateway Service entity components.

- [Requirements](#requirements)
- [Included components](#included-components)
- [Package Exports](#package-exports)
  - [Components](#components)
  - [Utilities](#utilities)
  - [Types](#types)
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

## Package Exports
The package exports the following components, utilities, and types for use in your application:

### Components

- `GatewayServiceList` – Component for listing Gateway Services.
- `GatewayServiceForm` – Component for creating or editing a Gateway Service (new version).
- `GatewayServiceConfigCard` – Component displaying configuration details for a Gateway Service.

### Utilities

- All utility functions from the `./utils` directory are exported for use.
  
Reference the [individual component docs](#individual-component-documentation) for more info.

### Types

- All TypeScript types from the `./types` directory are exported

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
- [`urlValidator()`](docs/url-validator.md)
