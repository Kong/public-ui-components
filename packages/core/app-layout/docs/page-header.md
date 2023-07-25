# AppPageHeader.vue

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
- `@kong/kongponents` must be available as a `dependency` in the host application, along with the package's style imports. [See here for instructions on installing Kongponents](https://kongponents.konghq.com/#globally-install-all-kongponents).

## Usage

### Install

[See instructions for installing the `@kong-ui-public/app-layout` package.](../README.md#install)

### Props

#### `title`

- type: `String`
- required: `true`
- default: `''`

The title text of the page.

#### `breadcrumbs`

- type: Array as PropType<BreadcrumbItem[]>
- required: `false`
- default: `[]`

Breadcrumb object to be passed into `KBreadcrumb`.

### Slots

#### `icon`

Content displayed right before the title text, typically an icon.

#### `badge`

Content displayed right after the title text, typically a badge.

#### `actions`

Content displayed opposite the title, typically an action menu.

#### `below`

Content displayed directly below the title.

---

[← Back to `@kong-ui-public/app-layout` docs](../README.md)
