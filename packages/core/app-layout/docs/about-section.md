# AppAboutSection.vue

A Kong UI dynamic about section component.

- [Features](#features)
- [Requirements](#requirements)
- [Usage](#usage)
  - [Install](#install)
  - [Props](#props)
  - [Slots](#slots)

## Features

- Reactive updates based on `prop` value changes :rocket:
- Slottable areas for displaying custom content

## Requirements

- `vue` must be initialized in the host application
- `@kong/kongponents` must be available as a `dependency` in the host application, along with the package's style imports. [See here for instructions on installing Kongponents](https://kongponents.konghq.com/#globally-install-all-kongponents).

## Usage

### Install

[See instructions for installing the `@kong-ui-public/app-layout` package.](../README.md#install)

### Props

#### `title`

- type: `String`
- required: `false`
- default: `''`

The title text of the about section.

#### `description`

- type: `String`
- required: `false`
- default: `''`

Descriptive text displayed below the `title`

#### `created`

- type: `String`
- required: `false`
- default: `''`

Created timestamp displayed to the left of the `actions` slot.

#### `createdLabel`

- type: `String`
- required: `false`
- default: `''`

Label text for the `created` timestamp, defaults to `Created`.

#### `modified`

- type: `String`
- required: `false`
- default: `''`

Modified timestamp displayed to the left of the `actions` slot.

#### `modifiedLabel`

- type: `String`
- required: `false`
- default: `''`

Label text for the `modified` timestamp, defaults to `Modified`.

### Slots

#### `actions`

Content displayed opposite the title.

#### `default`

Main content to be displayed in the section

#### `divider-section`

Additional content displayed below the main content, separated with a horizontal divider.

---

[← Back to `@kong-ui-public/app-layout` docs](../README.md)
