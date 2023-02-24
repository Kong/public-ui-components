# @kong-ui-public/metric-cards

A Kong UI component for display Traffic, Error Rate, and P99 Latency insights in a card-like format

- [@kong-ui-public/metric-cards](#kong-ui-publicmetric-cards)
  - [Features](#features)
  - [Requirements](#requirements)
  - [Usage](#usage)
    - [CSS Variables](#css-variables)
    - [Install](#install)
  - [Included Components](#included-components)
  

## Features

- Displays a summary panel containing various metrics
- Supports custom color themes via [CSS variables](#css-variables)

## Requirements

- `vue` must be initialized in the host application
- `@kong/kongponents` must be available as a `dependency` in the host application, along with the package's style imports. [See here for instructions on installing Kongponents](https://kongponents.konghq.com/#globally-install-all-kongponents). Specifically, the following Kongponents must be available:
  - `KAlert`
  - `KTooltip`
  - `KIcon`
  - `KSkeletonBox`

## Usage

```html
<template>
  <MetricCardContainer
    v-bind="metricCardOptions"
  />
</template>
<script setup lang="ts">
import { MetricCardContainer } from '../src'
import '@kong-ui-public/metric-cards/dist/style.css'

const metricCardOptions = {
  cards: [
    {
      currentValue: 192895156,
      previousValue: 236609609,
      title: 'Number of Requests',
      increaseIsBad: false,
      cardSize: 'lg',
    },
  ],
  loading: false,
  hasTrendAccess: true,
  fallbackDisplayText: 'Not available',
}
</script>
```

### CSS Variables
Variable | Description | Default
---------|----------|---------
`--kong-ui-metric-cards-background` | The background of the `.kong-ui-public-metric-cards` main container | `transparent`
`--kong-ui-metric-cards-title` | Metric card title font color | `#`
`--kong-ui-metric-cards-value` | Metric value font color | `#`
`--kong-ui-metric-cards-trend-negative` | Negative trend font color | `#d44324`
`--kong-ui-metric-cards-trend-positive` | Positive trend font color | `#07a88d`
`--kong-ui-metric-cards-trend-neutral` | Neutral trend font color | `#6f7787`

### Install

`yarn add @kong-ui-public/metric-cards`

## Included Components

The `MetricCardContainer` is a parent component which contains one or more instances of `MetricCard`.

Only `MetricCardContainer` is exported for use.
