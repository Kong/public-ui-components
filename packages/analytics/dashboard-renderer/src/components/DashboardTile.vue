<template>
  <div
    class="tile-boundary"
    :class="{ 'editable': context.editable }"
    :data-testid="`tile-${tileId}`"
  >
    <div
      v-if="definition.chart.type !== 'slottable'"
      class="tile-header"
    >
      <KTooltip
        class="title-tooltip"
        :disabled="!isTitleTruncated"
        max-width="500"
        :text="definition.chart.chart_title"
      >
        <div
          ref="titleRef"
          class="title"
        >
          {{ definition.chart.chart_title }}
        </div>
      </KTooltip>
      <div
        v-if="canShowTitleActions"
        class="tile-actions"
        :data-testid="`tile-actions-${tileId}`"
      >
        <KBadge
          v-if="badgeData"
          data-testid="time-range-badge"
          :tooltip="isAgedOutQuery ? agedOutWarning : undefined"
          :tooltip-attributes="{ maxWidth: '320px' }"
        >
          <template
            v-if="isAgedOutQuery"
            #icon
          >
            <WarningIcon :size="KUI_ICON_SIZE_20" />
          </template>
          <span class="badge-text">
            {{ badgeData }}
          </span>
        </KBadge>
        <EditIcon
          v-if="canShowKebabMenu && context.editable && !isFullscreen"
          class="edit-icon"
          :color="KUI_COLOR_TEXT_NEUTRAL"
          :data-testid="`edit-tile-${tileId}`"
          :size="KUI_ICON_SIZE_40"
          @click="editTile"
        />
        <KDropdown
          v-if="canShowKebabMenu && kebabMenuHasItems && !isFullscreen"
          class="dropdown"
          :data-testid="`chart-action-menu-${tileId}`"
          :kpop-attributes="{ placement: 'bottom-end' }"
        >
          <MoreIcon
            class="kebab-action-menu"
            :color="KUI_COLOR_TEXT_NEUTRAL"
            :data-testid="`kebab-action-menu-${tileId}`"
            :size="KUI_ICON_SIZE_40"
          />
          <template #items>
            <KDropdownItem
              v-if="!!exploreLinkKebabMenu"
              :data-testid="`chart-jump-to-explore-${tileId}`"
              :item="{ label: i18n.t('jumpToExplore'), to: exploreLinkKebabMenu }"
            />
            <KDropdownItem
              v-if="!!requestsLinkKebabMenu"
              :data-testid="`chart-jump-to-requests-${tileId}`"
              :item="{ label: i18n.t('jumpToRequests'), to: requestsLinkKebabMenu }"
            />
            <KDropdownItem
              v-if="!('allow_csv_export' in definition.chart) || definition.chart.allow_csv_export"
              class="chart-export-button"
              :data-testid="`chart-csv-export-${tileId}`"
              @click="exportCsv"
            >
              <span
                class="chart-export-trigger"
                :data-testid="`csv-export-button-${tileId}`"
              >
                {{ i18n.t('csvExport.exportAsCsv') }}
              </span>
            </KDropdownItem>
            <KDropdownItem
              v-if="context.editable"
              :data-testid="`duplicate-tile-${tileId}`"
              @click="duplicateTile"
            >
              {{ i18n.t('renderer.duplicateTile') }}
            </KDropdownItem>
            <KDropdownItem
              v-if="context.editable"
              :data-testid="`remove-tile-${tileId}`"
              @click="removeTile"
            >
              <span class="delete-option">{{ i18n.t('renderer.delete') }}</span>
            </KDropdownItem>
          </template>
        </KDropdown>
      </div>
      <div
        v-else-if="'description' in definition.chart"
        class="header-description"
        :data-testid="`tile-description-${tileId}`"
      >
        {{ definition.chart.description }}
      </div>
      <CsvExportModal
        v-if="exportModalVisible"
        :data-testid="`csv-export-modal-${tileId}`"
        :export-state="exportState"
        :filename="csvFilename"
        @close-modal="hideExportModal"
      />
    </div>
    <div
      class="tile-content"
      :data-testid="`tile-content-${tileId}`"
    >
      <component
        :is="componentData.component"
        v-if="componentData"
        v-bind="componentData.rendererProps"
        v-on="componentEventHandlers"
        @chart-data="onChartData"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DashboardRendererContextInternal, TileZoomEvent } from '../types'
import type {
  AbsoluteTimeRangeV4,
  AiExploreQuery,
  AnalyticsBridge,
  ExploreExportState,
  DashboardTileType,
  ExploreQuery,
  ExploreResultV4,
  FilterDatasource,
  TileDefinition,
} from '@kong-ui-public/analytics-utilities'

import { type Component, computed, defineAsyncComponent, inject, nextTick, readonly, ref, toRef, watch } from 'vue'
import { formatTime, TimePeriods, getFieldDataSources, msToGranularity, TIMEFRAME_LOOKUP, EXPORT_RECORD_LIMIT } from '@kong-ui-public/analytics-utilities'
import '@kong-ui-public/analytics-chart/dist/style.css'
import '@kong-ui-public/analytics-metric-provider/dist/style.css'
import SimpleChartRenderer from './SimpleChartRenderer.vue'
import BarChartRenderer from './BarChartRenderer.vue'
import { DEFAULT_TILE_HEIGHT, INJECT_QUERY_PROVIDER } from '../constants'
import TimeseriesChartRenderer from './TimeseriesChartRenderer.vue'
import GoldenSignalsRenderer from './GoldenSignalsRenderer.vue'
import { KUI_ICON_SIZE_20, KUI_SPACE_70 } from '@kong/design-tokens'
import TopNTableRenderer from './TopNTableRenderer.vue'
import composables from '../composables'
import { KUI_COLOR_TEXT_NEUTRAL, KUI_ICON_SIZE_40 } from '@kong/design-tokens'
import { MoreIcon, EditIcon, WarningIcon } from '@kong/icons'
import { CsvExportModal } from '@kong-ui-public/analytics-chart'
import DonutChartRenderer from './DonutChartRenderer.vue'

const PADDING_SIZE = parseInt(KUI_SPACE_70, 10)

const props = withDefaults(defineProps<{
  definition: TileDefinition
  context: DashboardRendererContextInternal
  height?: number
  isFullscreen?: boolean
  queryReady: boolean
  refreshCounter: number
  tileId: string | number
}>(), {
  height: DEFAULT_TILE_HEIGHT,
})

const emit = defineEmits<{
  (e: 'edit-tile', tile: TileDefinition): void
  (e: 'duplicate-tile', tile: TileDefinition): void
  (e: 'remove-tile', tile: TileDefinition): void
  (e: 'tile-time-range-zoom', newTimeRange: TileZoomEvent): void
}>()

const GeoMapRendererAsync = defineAsyncComponent(() => import('./GeoMapRenderer.vue'))
const queryBridge: AnalyticsBridge | undefined = inject(INJECT_QUERY_PROVIDER)
const { i18n } = composables.useI18n()
const chartData = ref<ExploreResultV4>()
const exportState = ref<ExploreExportState>({ status: 'loading' })
const exportModalVisible = ref<boolean>(false)
const titleRef = ref<HTMLElement>()
const isTitleTruncated = ref(false)
const loadingChartData = ref(true)

const {
  exploreLinkKebabMenu,
  requestsLinkKebabMenu,
  canShowKebabMenu,
  canGenerateRequestsLink,
  canGenerateExploreLink,
  requestsLinkZoomActions,
  exploreLinkZoomActions,
  buildExploreQuery,
  buildExploreLink,
  buildRequestLink,
  buildRequestsQueryZoomActions,
} = composables.useContextLinks({
  queryBridge,
  chartData: readonly(chartData),
  definition: readonly(toRef(props, 'definition')),
  context: readonly(toRef(props, 'context')),
})

const { issueQuery } = composables.useIssueQuery()

watch(() => props.definition, async () => {
  await nextTick()

  if (titleRef.value) {
    isTitleTruncated.value = titleRef.value.scrollWidth > titleRef.value.clientWidth
  }

  loadingChartData.value = true
}, { immediate: true, deep: true })

const csvFilename = computed<string>(() => i18n.t('csvExport.defaultFilename'))

const canShowTitleActions = computed((): boolean => (canShowKebabMenu.value && (kebabMenuHasItems.value || props.context.editable)) || !!badgeData.value)

const kebabMenuHasItems = computed((): boolean => !!exploreLinkKebabMenu.value || ('allow_csv_export' in props.definition.chart ? props.definition.chart.allow_csv_export : true) || props.context.editable)

const rendererLookup: Record<DashboardTileType, Component | undefined> = {
  'timeseries_line': TimeseriesChartRenderer,
  'timeseries_bar': TimeseriesChartRenderer,
  'horizontal_bar': BarChartRenderer,
  'vertical_bar': BarChartRenderer,
  'gauge': SimpleChartRenderer,
  'donut': DonutChartRenderer,
  'golden_signals': GoldenSignalsRenderer,
  'top_n': TopNTableRenderer,
  'slottable': undefined,
  'single_value': SimpleChartRenderer,
  'choropleth_map': GeoMapRendererAsync,
}

const componentEventHandlers = computed(() => ({
  ...(componentData.value?.rendererEvents.supportsRequests ? { 'select-chart-range': onSelectChartRange } : {}),
  ...(componentData.value?.rendererEvents.supportsZoom ? { 'zoom-time-range': onZoom } : {}),
}))

const componentData = computed(() => {
  // Ideally, Typescript would ensure that the prop types of the renderers match
  // the props that they're going to receive.  Unfortunately, actually doing this seems difficult.
  const component = rendererLookup[props.definition.chart.type]

  const supportsRequests = !!(component as any)?.emits?.includes('select-chart-range')
  const supportsZoom = !!(component as any)?.emits?.includes('zoom-time-range')

  return component && {
    component,
    rendererProps: {
      query: props.definition.query,
      context: props.context,
      queryReady: props.queryReady,
      chartOptions: props.definition.chart,
      height: props.height - PADDING_SIZE * 2,
      refreshCounter: props.refreshCounter,
      requestsLink: requestsLinkZoomActions.value,
      exploreLink: exploreLinkZoomActions.value,
    },
    rendererEvents: {
      supportsRequests,
      supportsZoom,
    },
  }
})

const badgeData = computed<string | null>(() => {
  const timeRange = props.definition.query?.time_range

  if (timeRange?.type === 'relative') {
    const timeframe = TimePeriods.get(TIMEFRAME_LOOKUP[timeRange.time_range])
    if (timeframe) {
      return timeframe.display
    }

    console.warn('Did not recognize the given relative time range:', timeRange.time_range)
    return timeRange.time_range
  } else if (timeRange?.type === 'absolute') {
    // Fall back to UTC if `tz` isn't explicitly specified because this gives the best results for dates without times.
    // When we support fine-grained absolute time, this assumption may need to be adjusted.
    const tz = timeRange.tz || 'Etc/UTC'
    return `${formatTime(timeRange.start, { short: true, tz })} - ${formatTime(timeRange.end, { short: true, tz })}`
  }

  return null
})

const chartDataGranularity = computed(() => {
  return chartData.value ? msToGranularity(chartData.value.meta.granularity_ms) : undefined
})

const isTimeSeriesChart = computed(() => {
  return ['timeseries_line', 'timeseries_bar'].includes(props.definition.chart.type)
})

const isAgedOutQuery = computed(() => {
  if (!isTimeSeriesChart.value || !props.queryReady || loadingChartData.value) {
    return false
  }

  const savedGranularity = props.definition?.query?.granularity

  if (!savedGranularity || !chartDataGranularity.value) {
    return false
  }

  return savedGranularity !== chartDataGranularity.value
})

const agedOutWarning = computed(() => {
  const currentGranularity = msToGranularity(chartData.value?.meta.granularity_ms ?? 0) ?? 'unknown'
  const savedGranularity = props.definition?.query?.granularity ?? 'unknown'

  return i18n.t('query_aged_out_warning', {
    currentGranularity: i18n.t(`granularities.${currentGranularity}` as any),
    savedGranularity: i18n.t(`granularities.${savedGranularity}` as any),
  })
})

/**
 * Derives the subset of context and tile query filters that is relevant for the tile's datasource.
 *
 * @returns Array of scoped filter objects to a datasource
 */
const datasourceScopedFilters = computed(() => {
  const filters = [...props.context.filters, ...props.definition.query.filters ?? []]

  // TODO: default to api_usage until datasource is made required
  const datasource = props.definition?.query?.datasource ?? 'api_usage'

  return filters.filter(f => {
    const possibleSources = getFieldDataSources(f.field)

    return possibleSources.some((ds: FilterDatasource) => datasource === ds)
  })
})

const editTile = () => {
  emit('edit-tile', props.definition)
}

const duplicateTile = () => {
  emit('duplicate-tile', props.definition)
}

const removeTile = () => {
  emit('remove-tile', props.definition)
}

const onChartData = (data: ExploreResultV4) => {
  chartData.value = data
  loadingChartData.value = false
}

const hideExportModal = () => {
  exportModalVisible.value = false
}

const exportCsv = async () => {
  exportModalVisible.value = true
  exportState.value = { status: 'loading' }

  issueQuery(props.definition.query, props.context, EXPORT_RECORD_LIMIT).then(queryResult => {
    exportState.value = { status: 'success', chartData: queryResult }
  }).catch(error => {
    exportState.value = { status: 'error', error: error }
  })
}

const onZoom = (newTimeRange: AbsoluteTimeRangeV4) => {
  const zoomEvent: TileZoomEvent = {
    tileId: props.tileId.toString(),
    timeRange: newTimeRange,
  }
  emit('tile-time-range-zoom', zoomEvent)
}

const onSelectChartRange = (newTimeRange: AbsoluteTimeRangeV4) => {
  const filters = datasourceScopedFilters.value
  const requestsQuery = buildRequestsQueryZoomActions(newTimeRange, filters)
  const exploreQuery = buildExploreQuery(newTimeRange, filters)

  requestsLinkZoomActions.value = canGenerateRequestsLink.value ? { href: buildRequestLink(requestsQuery) } : undefined
  exploreLinkZoomActions.value = canGenerateExploreLink.value ? { href: buildExploreLink(exploreQuery as ExploreQuery | AiExploreQuery) } : undefined
}
</script>

<style lang="scss" scoped>
.tile-boundary {
  display: flex;
  flex-direction: column;
  height: v-bind('`${height}px`');
  overflow: hidden;

  &.editable:hover {
    .tile-header {
      background: $kui-color-background-neutral-weakest;
    }
  }

  .tile-header {
    align-items: center;
    display: flex;
    justify-content: space-between;
    padding: var(--kui-space-50, $kui-space-50) var(--kui-space-50, $kui-space-50) var(--kui-space-40, $kui-space-40) var(--kui-space-50, $kui-space-50);
    right: 0;
    width: 100%;

    .title-tooltip {
      margin-right: $kui-space-20;
      overflow: hidden;
    }

    .title {
      font-weight: var(--kui-font-weight-bold, $kui-font-weight-bold);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .tile-actions {
      display: flex;
      gap: var(--kui-space-30, $kui-space-30);

      .edit-icon {
        cursor: pointer;
      }
    }

    .header-description {
      color: $kui-color-text-neutral;
      font-size: $kui-font-size-20;
      text-align: right;
    }

    .dropdown {
      display: flex;
      margin-left: var(--kui-space-auto, $kui-space-auto);
      margin-right: var(--kui-space-0, $kui-space-0);

      .kebab-action-menu {
        cursor: pointer;
      }

      .delete-option {
        color: $kui-color-text-danger;
      }

      li.k-dropdown-item {
        a {
          text-decoration: none;
        }
      }

      a {
        color: $kui-color-text;

        &:hover {
          color: $kui-color-text;
          text-decoration: none;
        }
      }

      &:hover {
        cursor: pointer;
      }
    }
  }

  .tile-content {
    flex-grow: 1;
    margin: var(--kui-space-20, $kui-space-20) var(--kui-space-60, $kui-space-60) var(--kui-space-60, $kui-space-60) var(--kui-space-60, $kui-space-60);
    overflow: hidden;
  }
}
</style>
