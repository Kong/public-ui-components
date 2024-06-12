<template>
  <div
    id="mapContainer"
    ref="mapContainer"
    class="kong-ui-public-analytics-geo-map"
  />
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import type { PropType } from 'vue'
import { Map, Popup } from 'maplibre-gl'
import type { ColorSpecification, DataDrivenPropertyValueSpecification, ExpressionSpecification, LngLatLike } from 'maplibre-gl'
import countriesGeoJson from '../countries.geo.json'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { LongLat } from '../types'
import type { FeatureCollection, Feature, MultiPolygon } from 'geojson'

const props = defineProps({
  countryMetrics: {
    type: Object as PropType<Record<string, number>>,
    required: true,
  },
  center: {
    type: Object as PropType<LongLat>,
    required: false,
    default: () => ({ lng: 0, lat: 35 }),
  },
  fitToCountry: {
    type: String,
    required: false,
    default: '',
  },
  initialZoom: {
    type: Number,
    required: false,
    default: 0,
    validator: (value: number) => value >= 0 && value <= 24,
  },
})

const mapContainer = ref<HTMLDivElement | null>(null)
const map = ref<Map>()

const mapOptions = computed(() => ({
  center: [props.center.lng, props.center.lat],
  zoom: props.initialZoom,
}))

const layerPaint = computed(() => ({
  'fill-color': [
    'match',
    ['get', 'ISO_A2'] as ExpressionSpecification,
    ...(Object.keys(props.countryMetrics).length
      ? Object.entries(props.countryMetrics).flatMap(([code, metric]) => [
        code,
        getColor(metric),
      ])
      : ['#ccc', '#ccc']),
    '#ccc', // default color if no match
  ] as DataDrivenPropertyValueSpecification<ColorSpecification>,
  'fill-opacity': 0.7,
}))

const getColor = (metric: number) => {
  if (metric > 80) return '#800026'
  if (metric > 60) return '#BD0026'
  if (metric > 40) return '#E31A1C'
  if (metric > 20) return '#FC4E2A'
  return '#FD8D3C'
}

const goToCountry = (countryCode: string) => {

  // Overrides for large spanning countries
  if (countryCode === 'RU') {
    map.value?.flyTo({ center: [93, 62], zoom: 2.5 })
    return
  } else if (countryCode === 'US') {
    map.value?.flyTo({ center: [-100, 52], zoom: 2.9 })
    return
  } else if (countryCode === 'FR') {
    map.value?.flyTo({ center: [2, 47], zoom: 5 })
    return
  } else if (countryCode === 'NO') {
    map.value?.flyTo({ center: [10, 65], zoom: 4.5 })
    return
  }

  const found = (countriesGeoJson as FeatureCollection).features.find((f: Feature) => f.properties?.ISO_A2 === countryCode)
  if (found) {
    const coordinates = (found.geometry as MultiPolygon).coordinates
    const allCoords = coordinates?.flat(2)

    const minLat = Math.min(...allCoords.map((c: number[]) => c[1]))
    const minLong = Math.min(...allCoords.map((c: number[]) => c[0]))

    const maxLat = Math.max(...allCoords.map((c: number[]) => c[1]))
    const maxLong = Math.max(...allCoords.map((c: number[]) => c[0]))

    map.value?.fitBounds([
      [minLong, minLat],
      [maxLong, maxLat],
    ])
  }
}

onMounted(() => {
  map.value = new Map({
    container: 'mapContainer',
    // style: 'https://demotiles.maplibre.org/style.json',
    // style: 'https://api.maptiler.com/maps/streets/style.json?key=cBeCDKkznq5O0aZc1ykX',
    // style: 'https://raw.githubusercontent.com/go2garret/maps/main/src/assets/json/openStreetMap.json',
    style: { version: 8, sources: {}, layers: [] },
    center: mapOptions.value.center as LngLatLike,
    zoom: mapOptions.value.zoom,
  })
  map.value.on('load', () => {
    map.value?.addSource('countries', {
      type: 'geojson',
      data: countriesGeoJson as FeatureCollection,
    })

    map.value?.addLayer({
      id: 'countries-layer',
      type: 'fill',
      source: 'countries',
      paint: layerPaint.value,
    })

    const popup = new Popup({
      closeButton: false,
      closeOnClick: false,
    })

    map.value?.on('mousemove', 'countries-layer', (e) => {
      const feature = e.features?.[0]
      if (feature) {
        const { ISO_A2, ADMIN } = feature.properties
        const metric = props.countryMetrics[ISO_A2]
        if (metric !== undefined) {
          popup.setLngLat(e.lngLat).setHTML(`<strong>${ADMIN}</strong>: ${metric}`).addTo(map.value as Map)
        } else {
          popup.remove()
        }
      }
    })

    map.value?.on('mouseleave', 'countries-layer', () => {
      popup.remove()
    })

  })
})

watch(() => props.countryMetrics, () => {
  if (map.value && map.value.isStyleLoaded()) {
    if (map.value.getLayer('countries-layer')) {
      map.value.removeLayer('countries-layer')
    }
    map.value.addLayer({
      id: 'countries-layer',
      type: 'fill',
      source: 'countries',
      paint: layerPaint.value,
    })

    if (props.fitToCountry) {
      goToCountry(props.fitToCountry)
    }
  }
})

watch(() => props.fitToCountry, (newVal) => {
  if (map.value && newVal) {
    goToCountry(newVal)
  }
})

</script>

<style lang="scss" scoped>
.kong-ui-public-analytics-geo-map {
  height: 100%;
  width: 100%;
}
</style>
