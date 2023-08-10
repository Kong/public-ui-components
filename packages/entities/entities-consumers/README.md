# @kong-ui-public/entities-consumers

Consumers entity components.

- [Requirements](#requirements)
- [Included components](#included-components)
- [Usage](#usage)
  - [Install](#install)
  - [Registration](#registration)
- [Individual component documentation](#individual-component-documentation)

## Requirements

Check the [individual component docs](#individual-component-documentation) for more info.

## Included components

- `ConsumerList`
- `ConsumerForm`
- `ConsumerConfigCard`

Reference the [individual component docs](#individual-component-documentation) for more info.

## Usage

### Install

Install the component in your host application

```sh
yarn add @kong-ui-public/entities-consumers
```

### Registration

Import the component(s) in your host application as well as the package styles

```ts
import { ConsumerList, ConsumerForm, ConsumerConfigCard } from '@kong-ui-public/entities-consumers'
import '@kong-ui-public/entities-consumers/dist/style.css'
```

## Individual component documentation

- [`<ConsumerList.vue />`](docs/consumer-list.md)
- [`<ConsumerForm.vue />`](docs/consumer-form.md)
- [`<ConsumerConfigCard.vue />`](docs/consumer-config-card.md)
