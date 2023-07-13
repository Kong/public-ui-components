# PageHeader.vue

A Kong UI dynamic page header component.

- [Features](#features)
- [Requirements](#requirements)
- [Usage](#usage)
  - [Install](#install)
  - [Props](#props)
  - [Slots](#slots)

## Features

- Reactive updates based on `prop` value changes :rocket:
- Slottable areas for displaying custom content, icons, etc.

## Requirements

- `vue` must be initialized in the host application
- `@kong/kongponents` must be available as a `dependency` in the host application, along with the package's style imports. [See here for instructions on installing Kongponents](https://kongponents.konghq.com/#globally-install-all-kongponents). Specifically, the following Kongponents must be available:
  - `KBreadcrumb`

## Usage

### Install

[See instructions for installing the `@kong-ui-public/app-layout` package.](../README.md#install)

### Props

#### `title`

- type: `String`
- required: `false`
- default: `''`

The title text of the page.

### Slots

#### `center`

The main slot to use for navbar content if you don't need a left/center/right navbar layout.

---

[← Back to `@kong-ui-public/app-layout` docs](../README.md)
