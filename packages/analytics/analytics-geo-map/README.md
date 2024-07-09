# @kong-ui-public/analytics-geo-map

This Vue component provides a geographical map visualization based on `maplibre-gl` and displays country metrics using color-coded layers. It supports dynamic updates to country metrics and allows focusing on specific countries.
Renders provided GeoJSON data into a choropleth style map.

- [Features](#features)
- [Requirements](#requirements)
- [Usage](#usage)
  - [Install](#install)
  - [Props](#props)
  - [Example](#example)

## Features

- Interactive geographical map visualization using `maplibre-gl`.
- Color-coded countries based on provided metrics.
- Tooltips showing country names and their corresponding metrics.
- Ability to focus on specific countries with customizable bounds.
- Dynamic updates to country metrics and map features.

## Requirements

- `vue` must be initialized in the host application.
- `maplibre-gl` must be added as a `dependency` in the host application. [See here](https://www.npmjs.com/package/maplibre-gl)

## Usage

### Install

First, ensure you have `maplibre-gl` installed:

```bash
npm install maplibre-gl
npm install @kong-ui-public/analytics-geo-map
```

### Props

#### `countryMetrics`

- **type:** `Object` (`Record<string, number>`)
- **required:** `true`
- **description:** An object mapping country codes to metric values. These metrics determine the color of each country on the map.

#### `geoJsonData`

- **type:** `Object` (`MapFeatureCollection`)
- **required:** `true`
- **description:** GeoJSON data for the map, defining the shapes and positions of countries.

#### `metricUnit`

- **type:** `Object` (`MetricUnits`)
- **required:** `true`
- **description:** Unit of measurement for the metrics displayed in the tooltips.

#### `metric`

- **type:** `Object` (`ExploreAggregations`)
- **required:** `true`
- **description:** Metric aggregations for the data displayed on the map.

#### `withLegend`

- **type:** `Boolean`
- **required:** `false`
- **default:** `true`
- **description:** Whether to display a legend on the map.

#### `showTooltipValue`

- **type:** `Boolean`
- **required:** `false`
- **default:** `true`
- **description:** Display value in the tooltip.

#### `fitToCountry`

- **type:** `Object` (`CountryISOA2 | null`)
- **required:** `false`
- **default:** `null`
- **description:** Country code to zoom in on.

#### `bounds`

- **type:** `Object` (`LngLatBoundsLike`)
- **required:** `false`
- **default:** `null`
- **description:** Longitudinal/Latitudinal bounds to initially fit the map to.

### Example

```vue
<template>
  <AnalyticsGeoMap
    :countryMetrics="countryMetrics"
    :geoJsonData="geoJsonData"
    :fitToCountry="'US'"
    metricUnit="%"
  />

  <!-- bounds to europe -->
  <AnalyticsGeoMap
    :countryMetrics="countryMetrics"
    :geoJsonData="geoJsonData"
    :bounds="[
      [-10, 35],
      [65, 72]
    ]"
    metricUnit="%"
  />
</template>

<script setup>
import { ref } from 'vue'
import AnalyticsGeoMap from '@kong-ui-public/analytics-geo-map'
import geoJsonData from './path-to-geojson-data.json'

const countryMetrics = ref({
  US: 75,
  CA: 50,
  MX: 25,
  // Other countries
})
</script>
