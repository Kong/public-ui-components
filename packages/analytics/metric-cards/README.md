# @kong-ui-public/metric-cards

A Kong UI component for display Traffic, Error Rate, and P99 Latency insights in a card-like format

- [@kong-ui-public/metric-cards](#kong-ui-publicmetric-cards)
  - [Features](#features)
  - [Requirements](#requirements)
    - [CSS Variables](#css-variables)
    - [Install](#install)
    - [Props](#props)
  - [Included Components](#included-components)
  - [Usage](#usage)
  

## Features

- Displays a summary panel containing various metrics
- Supports custom color themes via [CSS variables](#css-variables)

## Requirements

- `vue` must be initialized in the host application
- `@kong/kongponents` must be available as a `dependency` in the host application, along with the package's style imports. [See here for instructions on installing Kongponents](https://kongponents.konghq.com/#globally-install-all-kongponents). Specifically, the following Kongponents must be available:
  - `KIcon`
  - `KSkeletonBox`
  - `KTooltip`

### CSS Variables
Variable | Description | Default
---------|----------|---------
`--kong-ui-metric-card-background` | The background of the `.kong-ui-public-metric-card-container` main container | `transparent`
`--kong-ui-metric-card-title` | Metric card title font color | `#`
`--kong-ui-metric-card-value` | Metric value and description font color | `#`
`--kong-ui-metric-card-trend-negative` | Negative trend font color | `#AD000E`
`--kong-ui-metric-card-trend-positive` | Positive trend font color | `#07a88d`
`--kong-ui-metric-card-trend-neutral` | Neutral trend font color | `#52596E`
`--kong-ui-metric-card-trend-bg-negative` | Negative trend background color | `#FFE5E5`
`--kong-ui-metric-card-trend-bg-positive` | Positive trend background color | `#ECFFFB`
`--kong-ui-metric-card-trend-bg-neutral` | Neutral trend background color | `#E0E4EA`

### Install

`yarn add @kong-ui-public/metric-cards`

### Props

####  `cardType`

One of the three golden signals (Traffic, Error Rate, Latency) or a Generic count

  - type: `MetricCardType`
  - required: `false`

#### `title`

Title to be displayed in the metric card header

- type: `String`
- required: `false`

#### `tooltip`

Deprecated

- type: `String`
- required: `false`

#### `metricChange`

Change from current to previous time frame

- type: `String`
- required: `false`

#### `changePolarity`

Determines if the `metricChange` is bad or good

- type: `Number`
- required: `true`

#### `trendIcon`

Whether trend is up, down, or neutral (no change)

- type: `typeof GenericIcon`
- required: `false`

#### `trendRange`

A description of the time period involved in the calculation, determined internally by the MetricsProvider

- type: `string`
- required: `false`

#### `hasError`

Will display a warning icon instead of metric value if true

- type: `Boolean`
- required: `false`

#### `errorMessage`

Message to be displayed if the API request fails

- type: `String`
- required: `false`

## Included Components

The `MetricCardContainer` is a parent component which contains one or more instances of `MetricCard`.

Only `MetricCardContainer` is exported for use.

## Exports

### Types

- MetricCardDef
- MetricCardDisplayValue
- MetricCardContainerOptions

### Enums

- MetricCardSize
- MetricCardType

## Usage

```html
<template>
  <MetricCardContainer
    v-bind="metricCardOptions"
  />
</template>
<script setup lang="ts">
import { MetricCardType, MetricCardSize, MetricCardContainer } from '@kong-ui-public/metric-cards'
import '@kong-ui-public/metric-cards/dist/style.css'

const metricCardOptions = {
  cards: [
    {
      cardType: MetricCardType.TRAFFIC,
      currentValue: 192895156,
      previousValue: 236609609,
      title: 'Number of Requests',
      description: 'Requests sent throgh all data plane nodes'
      increaseIsBad: false,
      cardSize: MetricCardSize.Large,
      trendRange: 'vs previous 7 days'
    },
  ],
  loading: false,
  hasTrendAccess: true,
  fallbackDisplayText: 'Not available',
}
</script>
```
