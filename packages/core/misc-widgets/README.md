# @kong-ui-public/misc-widgets

A collection of miscellaneous components and widgets.

This package is a good home for random, one-off components that aren't complex and a standalone package is not necessary.

- [Components](#components)
- [Requirements](#requirements)
- [Usage](#usage)
  - [Install](#install)
  - [Register Components](#register-components)

## Components

- [Github Star](src/components/github-star/README.md)

## Requirements

- `vue` must be initialized in the host application
- `@kong/kongponents` must be available as a `dependency` in the host application, along with the package's style imports. [See here for instructions on installing Kongponents](https://kongponents.konghq.com/#globally-install-all-kongponents).
- `@kong-ui-public/i18n` must be available as a `dependency` in the host application.

## Usage

### Install

Install the package in your host application

```sh
yarn add @kong-ui-public/misc-widgets

# OR

pnpm --filter="@kong-ui/konnect-app-{name} add @kong-ui-public/misc-widgets"
```

### Register Components

You can import individual components locally where they are being used. Don't forget to import the styles as well.

```html
<template>
  <GithubStar />
</template>

<script setup lang="ts">
import { GithubStar } from '@kong-ui-public/misc-widgets'
import '@kong-ui-public/misc-widgets/dist/style.css'
</script>
```
