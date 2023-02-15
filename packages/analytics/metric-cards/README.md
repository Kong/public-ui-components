# @kong-ui-public/metric-cards

A Kong UI component for display Traffic, Error Rate, and P99 Latency insights in a card-like format

- [@kong-ui-public/metric-cards](#kong-ui-publicmetric-cards)
      - [Features](#features)
  - [Requirements](#requirements)
  - [Usage](#usage)
    - [Install](#install)
  - [Included Components](#included-components)
    - [`MetricCardsContainer`](#metriccardscontainer)
  

## Features

- List of package feature
- TODO

## Requirements

- List of package requirements (e.g. "`vue` and must be initialized in the host application")
- 
TODO

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

import { SpecRenderer, SpecOperationsList, SpecDetails } from '@kong-ui-public/spec-renderer'
// CSS import required for ANY of the components
import '@kong-ui-public/spec-renderer/dist/style.css'
</script>
```

### Install

{Installation instructions}

## Included Components

The `MetricCardsContainer` component containers a one (1) or more `MetricCard`s as subcomponents.

Only the `MetricCardContainer` is exported for use.
### `MetricCardsContainer`

See the component [documentation](docs/metric-cards).
