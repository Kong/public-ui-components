# @kong-ui-public/entities-snis

SNI entity components.

- [Requirements](#requirements)
- [Included components](#included-components)
- [Usage](#usage)
  - [Install](#install)
  - [Registration](#registration)
- [Individual component documentation](#individual-component-documentation)

## Requirements

Check the [individual component docs](#individual-component-documentation) for more info.

## Included components

- `SniList`
- `SniForm`

Reference the [individual component docs](#individual-component-documentation) for more info.

## Usage

### Install

Install the component in your host application

```sh
yarn add @kong-ui-public/entities-snis
```

### Registration

Import the component(s) in your host application as well as the package styles

```ts
import { SniList, SniForm } from '@kong-ui-public/entities-snis'
import '@kong-ui-public/entities-snis/dist/style.css'
```

## Individual component documentation

- [`<SniList.vue />`](docs/sni-list.md)
- [`<SniForm.vue />`](docs/sni-form.md)
