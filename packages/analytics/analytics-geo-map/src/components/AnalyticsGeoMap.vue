<template>
  <div
    id="mapContainer"
    class="kong-ui-public-analytics-geo-map"
  />
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { Map, Popup } from 'maplibre-gl'
import type { PropType } from 'vue'
import type { ColorSpecification, DataDrivenPropertyValueSpecification, ExpressionSpecification, LngLatLike, MapOptions } from 'maplibre-gl'
import type { CountryISOA2, LongLat, MapFeatureCollection } from '../types'
import type { Feature, MultiPolygon, Geometry, GeoJsonProperties } from 'geojson'
import composables from '../composables'
import 'maplibre-gl/dist/maplibre-gl.css'

const props = defineProps({
  countryMetrics: {
    type: Object as PropType<Record<string, number>>,
    required: true,
  },
  geoJsonData: {
    type: Object as PropType<MapFeatureCollection>,
    required: true,
  },
  center: {
    type: Object as PropType<LongLat>,
    required: false,
    default: null,
  },
  fitToCountry: {
    type: Object as PropType<CountryISOA2 | null>,
    required: false,
    default: null,
  },
  initialZoom: {
    type: Number,
    required: false,
    default: null,
    validator: (value: number) => value >= 0 && value <= 24,
  },
  metricUnit: {
    type: String,
    required: false,
    default: '',
  },
})
const map = ref<Map>()

const { i18n } = composables.useI18n()

const layerPaint = computed(() => ({
  'fill-color': [
    'match',
    ['get', 'iso_a2'] as ExpressionSpecification,
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
  if (metric > 80) return '#296378'
  if (metric > 60) return '#0D8093'
  if (metric > 40) return '#009FA9'
  if (metric > 20) return '#00BDB7'
  return '#0CDCBD'
}

// Simplified coords may be 2 or 3 layers
const flattenPositions = (position: any): number[][] => {
  const flat: (number | number[])[] = position.flat(1)

  if (Array.isArray(flat[0]) && Array.isArray(flat[0][0])) {
    return flattenPositions(flat)
  }

  return flat as number[][]
}

const goToCountry = (countryCode: CountryISOA2) => {

  // Overrides for large spanning countries
  if (countryCode === 'RU') {
    map.value?.fitBounds([
      [20, 40],
      [180, 80],
    ])
    return
  } else if (countryCode === 'US') {
    map.value?.fitBounds([
      [-130, 20],
      [-60, 50],
    ])
    return
  } else if (countryCode === 'FR') {
    map.value?.fitBounds([
      [-5, 42],
      [9, 51],
    ])
    return
  } else if (countryCode === 'NO') {
    map.value?.fitBounds([
      [4, 57],
      [32, 71],
    ])
    return
  }

  const found: Feature<Geometry, GeoJsonProperties> | undefined = (props.geoJsonData).features.find((f: Feature) => f.properties?.iso_a2 === countryCode)
  if (found) {
    const coordinates = (found.geometry as MultiPolygon)?.coordinates
    if (!coordinates) return
    const allCoords = flattenPositions(coordinates)

    const lats = allCoords.map((c: number[]) => c[1])
    const longs = allCoords.map((c: number[]) => c[0])

    const minLat = Math.min(...lats)
    const maxLat = Math.max(...lats)
    const minLong = Math.min(...longs)
    const maxLong = Math.max(...longs)
    map.value?.fitBounds([
      [minLong, minLat],
      [maxLong, maxLat],
    ])
  }
}

const mapOptions = computed(() => {
  const options: MapOptions = {
    container: 'mapContainer',
    style: { version: 8, sources: {}, layers: [] },
  }
  if (!props.center && !props.initialZoom) {
    options.bounds = [
      [-180, -90],
      [180, 90],
    ]
  } else {
    if (props.center) {
      options.center = props.center as LngLatLike
    }
    if (props.initialZoom) {
      options.zoom = props.initialZoom
    }
  }

  return options
})

onMounted(() => {

  map.value = new Map(mapOptions.value)
  map.value.on('load', () => {
    map.value?.addSource('countries', {
      type: 'geojson',
      data: props.geoJsonData,
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
        const { iso_a2, admin } = feature.properties
        const metric = props.countryMetrics[iso_a2]
        if (metric !== undefined) {
          // @ts-ignore - dynamic i18n key
          popup.setLngLat(e.lngLat).setHTML(`<strong>${admin}</strong>: ${metric} ${i18n.t(props.metricUnit)}`).addTo(map.value as Map)
        } else {
          popup.remove()
        }
      }
    })

    map.value?.on('mouseleave', 'countries-layer', () => {
      popup.remove()
    })

    if (props.fitToCountry) {
      goToCountry(props.fitToCountry)
    }

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
  }
})

watch(() => props.fitToCountry, (newVal) => {
  if (map.value && newVal) {
    goToCountry(newVal)
  } else {
    if (!mapOptions.value.center && !mapOptions.value.zoom) {
      map.value?.fitBounds([
        [-180, -90],
        [180, 90],
      ])
    } else {
      if (mapOptions.value.zoom) {
        map.value?.setZoom(mapOptions.value.zoom)
      }
      if (mapOptions.value.center) {
        map.value?.flyTo({ center: mapOptions.value.center })
      }
    }
  }
})

</script>

<style lang="scss" scoped>
.kong-ui-public-analytics-geo-map {
  height: 100%;
  width: 100%;
}
</style>
