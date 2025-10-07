<template>
  <div class="kong-ui-public-analytics-geo-map">
    <div
      v-if="showNoLocationOverlay"
      class="no-location-overlay"
    >
      <slot name="no-location-icon">
        <AnalyticsIcon
          :color="KUI_ICON_COLOR_NEUTRAL"
          :size="KUI_ICON_SIZE_60"
        />
      </slot>
      <div class="no-location-overlay-title">
        <slot name="no-location-title">
          {{ i18n.t('no_location_data') }}
        </slot>
      </div>
      <div class="no-location-overlay-description">
        <slot name="no-location-description">
          <p>{{ i18n.t('no_location_data_description') }}</p>
        </slot>
      </div>
    </div>
    <div
      :id="mapContainerId"
      class="analytics-geo-map-container"
    />
    <!-- Legend -->
    <MapLegend
      v-if="showLegend"
      class="legend-container"
      :data="legendData"
      :metric="metric"
      :title="legendTitle"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed, useId, toRef } from 'vue'
import { Map, Popup } from 'maplibre-gl'
import type { ColorSpecification, DataDrivenPropertyValueSpecification, ExpressionSpecification, LngLatBoundsLike, MapOptions } from 'maplibre-gl'
import type { MapFeatureCollection, MetricUnits } from '../types'
import type { Feature, MultiPolygon, Geometry, GeoJsonProperties, FeatureCollection } from 'geojson'
import composables from '../composables'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { ExploreAggregations, CountryISOA2 } from '@kong-ui-public/analytics-utilities'
import lakes from '../ne_110m_lakes.json'
import * as geobuf from 'geobuf'
import Pbf from 'pbf'
import { debounce } from '../utils'
import { AnalyticsIcon } from '@kong/icons'
import { KUI_ICON_COLOR_NEUTRAL, KUI_ICON_SIZE_60 } from '@kong/design-tokens'
import MapLegend from './MapLegend.vue'

const countriesPbfUrlPromise = import('../countries-simple-geo.pbf?url').then(m => m.default)

const {
  countryMetrics,
  metricUnit,
  metric,
  withLegend = true,
  showTooltipValue = true,
  fitToCountry = undefined,
  bounds = undefined,
} = defineProps<{
  countryMetrics: Record<string, number>
  metricUnit: MetricUnits
  metric: ExploreAggregations
  withLegend?: boolean
  showTooltipValue?: boolean
  fitToCountry?: CountryISOA2 | undefined
  bounds?: Array<[number, number]>
}>()

const emit = defineEmits<{
  (e: 'boundsChange', value: Array<[number, number]>): void
}>()

const { i18n } = composables.useI18n()
const { getColor, formatMetric, legendData } = composables.useMetricUtils({
  countryMetrics: toRef(() => countryMetrics),
  metric: toRef(() => metric),
})
const mapContainerId = useId()
const map = ref<Map>()
const geoJsonData = ref<MapFeatureCollection | null>(null)
const showNoLocationOverlay = computed(() => {
  return Object.keys(countryMetrics).length === 0 && !fitToCountry
})
const layerPaint = computed(() => ({
  'fill-color': [
    'match',
    [
      'coalesce',
      [
        'case',
        ['==', ['get', 'iso_a2'], '-99'],
        ['get', 'iso_a2_eh'],
        ['get', 'iso_a2'],
      ] as ExpressionSpecification,
      ['get', 'ISO_A2'],
    ] as ExpressionSpecification,
    ...(Object.keys(countryMetrics).length
      ? Object.entries(countryMetrics).flatMap(([code, metric]) => [
        code,
        getColor(metric),
      ])
      : ['#ccc', '#ccc']),
    '#ccc', // default color if no match
  ] as DataDrivenPropertyValueSpecification<ColorSpecification>,
  'fill-opacity': 0.7,
}))

const showLegend = computed(() => {
  return withLegend && Object.keys(countryMetrics).length > 0
})

const legendTitle = computed(() => {
  // @ts-ignore - dynamic i18n key
  return metric && i18n.t(`metrics.${metric}`) || ''
})

// Simplified coords may be 2 or 3 layers
const flattenPositions = (position: any): number[][] => {
  const flat: Array<number | number[]> = position.flat(1)

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

  const found: Feature<Geometry, GeoJsonProperties> | undefined = geoJsonData.value?.features.find((f: Feature) => {
    if (f.properties?.ISO_A2) {
      return f.properties?.ISO_A2 === countryCode
    }
    return f.properties?.iso_a2 === '-99' ?
      f.properties?.iso_a2_eh === countryCode :
      f.properties?.iso_a2 === countryCode
  })
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
    container: mapContainerId,
    style: { version: 8, sources: {}, layers: [] },
    attributionControl: false,
    // fit bounds for whole world minus antarctica
    maxBounds: [
      [-179, -75], // -75 south tip of south america
      [179, 90],
    ],
    cooperativeGestures: true,
    locale: {
      'CooperativeGesturesHandler.WindowsHelpText': i18n.t('cooperative_gestures.windows_zoom_help_text'),
      'CooperativeGesturesHandler.MacHelpText': i18n.t('cooperative_gestures.mac_zoom_help_text'),
      'CooperativeGesturesHandler.MobileHelpText': i18n.t('cooperative_gestures.mobile_zoom_help_text'),
    },
  }

  if (bounds) {
    options.bounds = bounds as LngLatBoundsLike
  }

  return options
})

const emitBounds = () => {
  if (!map.value) return
  const b = map.value.getBounds()
  const sw = b.getSouthWest()
  const ne = b.getNorthEast()
  emit('boundsChange', [
    [sw.lng, sw.lat],
    [ne.lng, ne.lat],
  ])
}

const debouncedEmitBounds = debounce(emitBounds, 300)

onMounted(async () => {
  try {
    const countriesPbfUrl = await countriesPbfUrlPromise
    const response = await fetch(countriesPbfUrl)
    const rawBuf = new Uint8Array(await response.arrayBuffer())
    const geoData = geobuf.decode(new Pbf(rawBuf)) as MapFeatureCollection
    geoJsonData.value = geoData

    map.value = new Map(mapOptions.value)
    map.value.on('load', () => {
      map.value?.addSource('countries', {
        type: 'geojson',
        data: geoData,
      })

      map.value?.addLayer({
        id: 'countries-layer',
        type: 'fill',
        source: 'countries',
        paint: layerPaint.value,
      })

      map.value?.addSource('lakes', {
        type: 'geojson',
        data: lakes as FeatureCollection,
      })

      map.value?.addLayer({
        id: 'lakes-layer',
        type: 'fill',
        source: 'lakes',
        paint: {
          'fill-color': '#FFFFFF',
        },
      })

      const popup = new Popup({
        closeButton: false,
        closeOnClick: false,
      })

      map.value?.on('mousemove', 'countries-layer', (e) => {
        const feature = e.features?.[0]
        if (feature) {
          const { iso_a2, iso_a2_eh, ISO_A2, admin } = feature.properties
          const lookup: CountryISOA2 = ISO_A2 ?? iso_a2 === '-99' ? iso_a2_eh : iso_a2
          const metric = countryMetrics[lookup]

          if (metric !== undefined) {
            let popupHtml

            if (showTooltipValue) {
              popupHtml = `<strong data-testid="geo-map-tooltip">${admin}</strong>: ${formatMetric(metric)} ${i18n.t(`metricUnits.${metricUnit}`, { plural: metric > 1 ? 's' : '' })}`
            } else {
              popupHtml = `<strong data-testid="geo-map-tooltip">${admin}</strong>`
            }

            popup.setLngLat(e.lngLat).setHTML(popupHtml).addTo(map.value as Map)
          } else {
            popup.remove()
          }
        }
      })

      map.value?.on('mouseleave', 'countries-layer', () => {
        popup.remove()
      })

      map.value?.on('move', debouncedEmitBounds)

      if (fitToCountry) {
        goToCountry(fitToCountry)
      }

    })
    // disable map rotation using right click + drag
    map.value?.dragRotate.disable()

    // disable map rotation using keyboard
    map.value?.keyboard.disable()

    // disable map rotation using touch rotation gesture
    map.value?.touchZoomRotate.disableRotation()
  } catch (e) {
    console.error(e)
  }
})

watch(() => countryMetrics, () => {
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
    map.value.removeLayer('lakes-layer')
    map.value?.addLayer({
      id: 'lakes-layer',
      type: 'fill',
      source: 'lakes',
      paint: {
        'fill-color': '#FFFFFF',
      },
    })
  }
})

watch(() => fitToCountry, (newVal) => {
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

watch(() => bounds, (newVal, oldVal) => {
  if (!newVal) return
  const newFlattened = newVal?.flat()
  const oldFlattened = oldVal?.flat()
  const equal = newFlattened && oldFlattened && newFlattened.length === oldFlattened.length &&
    newFlattened.every((v, i) => Math.round(v * 100) / 100 === Math.round(oldFlattened[i] * 100) / 100)
  if (!equal && map.value) {
    map.value.fitBounds(newVal as LngLatBoundsLike)
  }
})

</script>

<style lang="scss" scoped>
:deep(.maplibregl-map) {
  font-family: var(--kui-font-family-text, $kui-font-family-text);
}

.kong-ui-public-analytics-geo-map {
  height: 100%;
  position: relative;
  width: 100%;

  .analytics-geo-map-container {
    height: 100%;
    width: 100%;
  }

  .no-location-overlay {
    align-items: center;
    background: rgba(255, 255, 255, 0.7);
    bottom: 0;
    display: flex;
    flex-direction: column;
    gap: var(--kui-space-70, $kui-space-70);
    justify-content: center;
    left: 0;
    position: absolute;
    right: 0;
    text-align: center;
    top: 0;
    z-index: 1;

    .no-location-overlay-title {
      color: var(--kui-color-text, $kui-color-text);
      font-size: var(--kui-font-size-50, $kui-font-size-50);
      font-weight: var(--kui-font-weight-bold, $kui-font-weight-bold);
      line-height: var(--kui-line-height-40, $kui-line-height-40);
      max-width: 570px;
    }

    .no-location-overlay-description {
      color: var(--kui-color-text-neutral, $kui-color-text-neutral);
      display: flex;
      flex-direction: column;
      font-size: var(--kui-font-size-30, $kui-font-size-30);
      font-weight: var(--kui-font-weight-regular, $kui-font-weight-regular);
      gap: var(--kui-space-70, $kui-space-70);
      line-height: var(--kui-line-height-30, $kui-line-height-30);
      max-width: 640px;

      p {
        margin: var(--kui-space-0, $kui-space-0);
      }
    }
  }

  .legend-container {
    right: 8px;
    top: 8px;
  }
}
</style>
