# TopNTable.vue

A simple table component to display the top N records.

- [Requirements](#requirements)
- [Usage](#usage)
  - [Install](#install)
  - [Props](#props)
  - [Slots](#slots)
  - [Usage example](#usage-example)

## Requirements

- `vue` must be initialized in the host application
- `@kong/kongponents` must be added as a `dependency` in the host application, globally available via the Vue Plugin installation, and the package's style imports must be added in the app entry file. [See here for instructions on installing Kongponents](https://kongponents.konghq.com/#globally-install-all-kongponents).

## Usage

### Install

[See instructions for installing the `@kong-ui-public/analytics-chart` package.](../README.md#install)

### Props

#### `data`

- type: `Object as PropType<AnalyticsExploreV3Result>`
- required: `true`
- default: `undefined`

The analytics API response.

#### `title`

- type: `String`
- required: `true`
- default: `''`

Text to be displayed for the title of the table.

#### `description`

- type: `String`
- required: `false`
- default: `''`

Text to be displayed opposite the card title.

#### `emptyStateTitle`

- type: `String`
- required: `false`
- default: `''`

Text to be displayed on the empty state.

#### `isLoading`

- type: `Boolean`
- required: `false`
- default: `false`

Whether or not to display the loading state.

### Slots

#### name

Content to override the display for each row item's first column. The `id`, `name`, and `dimension` of the row item will be provided in the slot params. If not provided, the `name` will be displayed in plain text.

### Usage example

Please refer to the [sandbox](../sandbox/App.vue).
