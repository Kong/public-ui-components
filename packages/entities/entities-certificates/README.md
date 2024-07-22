# @kong-ui-public/entities-certificates

Certificates and CA Certificates entities components.

- [Requirements](#requirements)
- [Included components](#included-components)
- [Usage](#usage)
  - [Install](#install)
  - [Registration](#registration)
- [Individual component documentation](#individual-component-documentation)

## Requirements

- `vue` and `vue-router` must be initialized in the host application
- `@kong/kongponents` must be added as a `dependency` in the host application, globally available via the Vue Plugin installation, and the package's style imports must be added in the app entry file. [See here for instructions on installing Kongponents](https://kongponents.konghq.com/#globally-install-all-kongponents).
- `@kong-ui-public/i18n` must be available as a `dependency` in the host application.
- `axios` must be installed as a `dependency` in the host application.

## Included components

- `CertificateList`
- `CACertificateList`
- `CertificateForm`
- `CACertificateForm`
- `CertificateConfigCard`

Reference the [individual component docs](#individual-component-documentation) for more info.

## Usage

### Install

Install the component in your host application

```sh
yarn add @kong-ui-public/entities-certificates
```

### Registration

Import the component(s) in your host application as well as the package styles

```ts
import {
  CertificateList,
  CertificateForm,
  CertificateConfigCard
  CACertificateList,
  CACertificateForm
  CACertificateConfigCard,
} from '@kong-ui-public/entities-certificates'
import '@kong-ui-public/entities-certificates/dist/style.css'
```

## Individual component documentation

- [`<CertificateList.vue />`](docs/certificate-list.md)
- [`<CACertificateList.vue />`](docs/ca-certificate-list.md)
- [`<CACertificateConfigCard.vue />`](docs/ca-certificate-config-card.md)
- [`<CertificateForm.vue />`](docs/certificate-form.md)
- [`<CACertificateForm.vue />`](docs/ca-certificate-form.md)
- [`<CertificateConfigCard.vue />`](docs/certificate-config-card.md)
