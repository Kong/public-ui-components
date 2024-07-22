# @kong-ui-public/entities-upstreams-targets

Upstreams and targets entities components.

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

- `UpstreamsList`
- `TargetsList`
- `TargetForm`
- `UpstreamsForm`
- `UpstreamsFormGeneralInfo`
- `UpstreamsFormLoadBalancing`
- `UpstreamsFormHealthChecks`
- `UpstreamsFormActiveHealthCheck`
- `UpstreamsFormPassiveHealthCheck`
- `UpstreamsConfigCard`


Reference the [individual component docs](#individual-component-documentation) for more info.

## Usage

### Install

Install the component in your host application

```sh
yarn add @kong-ui-public/entities-upstreams-targets
```

### Registration

Import the component(s) in your host application as well as the package styles

```ts
import { 
 UpstreamsList,
 TargetsList,
 TargetForm,
 UpstreamsForm,
 UpstreamsConfigCard,
} from '@kong-ui-public/entities-upstreams-targets'
import '@kong-ui-public/entities-upstreams-targets/dist/style.css'
```

## Individual component documentation

- [`<UpstreamsList.vue />`](docs/upstreams-list.md)
- [`<TargetsList.vue />`](docs/targets-list.md)
- [`<TargetForm.vue />`](docs/target-form.md)
- [`<UpstreamsFormGeneralInfo.vue />`](docs/upstreams-form-general-info.md)
- [`<UpstreamsFormLoadBalancing.vue />`](docs/upstreams-form-load-balancing.md)
- [`<UpstreamsFormHealthChecks.vue />`](docs/upstreams-form-healthchecks.md)
- [`<UpstreamsFormActiveHealthCheck.vue />`](docs/upstreams-form-active-healthcheck.md)
- [`<UpstreamsFormPassiveHealthCheck.vue />`](docs/upstreams-form-passive-healthcheck.md)
- [`<UpstreamsForm.vue />`](docs/upstreams-form.md)
- [`<UpstreamsConfigCard.vue />`](docs/upstreams-config-card.md)
