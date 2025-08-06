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
          v-if="canShowKebabMenu && context.editable"
          class="edit-icon"
          :color="KUI_COLOR_TEXT_NEUTRAL"
          :data-testid="`edit-tile-${tileId}`"
          :size="KUI_ICON_SIZE_40"
          @click="editTile"
        />
        <KDropdown
          v-if="canShowKebabMenu && kebabMenuHasItems"
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
              v-if="!!exploreLink"
              :data-testid="`chart-jump-to-explore-${tileId}`"
              :item="{ label: i18n.t('jumpToExplore'), to: exploreLink }"
            />
            <KDropdownItem
              v-if="hasZoomActions && !!requestsLink"
              :data-testid="`chart-jump-to-requests-${tileId}`"
              :item="{ label: i18n.t('jumpToRequests'), to: requestsLink }"
            />
            <KDropdownItem
              v-if="!('allowCsvExport' in definition.chart) || definition.chart.allowCsvExport"
              class="chart-export-button"
              :data-testid="`chart-csv-export-${tileId}`"
              @click="exportCsv()"
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
        :chart-data="(chartData as ExploreResultV4)"
        :data-testid="`csv-export-modal-${tileId}`"
        :filename="csvFilename"
        @toggle-modal="setExportModalVisibility"
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
        @chart-data="onChartData"
        @view-requests="onViewRequests"
        @zoom-time-range="emit('zoom-time-range', $event)"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
import type { DashboardRendererContextInternal } from '../types'
import {
  type DashboardTileType,
  formatTime,
  type TileDefinition,
  TimePeriods,
  getFieldDataSources,
} from '@kong-ui-public/analytics-utilities'
import { type Component, computed, inject, nextTick, onMounted, ref, watch } from 'vue'
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
import { msToGranularity } from '@kong-ui-public/analytics-utilities'
import type { AiExploreAggregations, AiExploreQuery, AnalyticsBridge, ExploreAggregations, ExploreQuery, ExploreResultV4, QueryableAiExploreDimensions, QueryableExploreDimensions, TimeRangeV4, AbsoluteTimeRangeV4, AllFilters } from '@kong-ui-public/analytics-utilities'
import { CsvExportModal } from '@kong-ui-public/analytics-chart'
import { TIMEFRAME_LOOKUP } from '@kong-ui-public/analytics-utilities'
import DonutChartRenderer from './DonutChartRenderer.vue'

const PADDING_SIZE = parseInt(KUI_SPACE_70, 10)

const props = withDefaults(defineProps<{
  definition: TileDefinition
  context: DashboardRendererContextInternal
  height?: number
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
  (e: 'zoom-time-range', newTimeRange: AbsoluteTimeRangeV4): void
}>()

const queryBridge: AnalyticsBridge | undefined = inject(INJECT_QUERY_PROVIDER)
const { i18n } = composables.useI18n()
const chartData = ref<ExploreResultV4>()
const exportModalVisible = ref<boolean>(false)
const titleRef = ref<HTMLElement>()
const isTitleTruncated = ref(false)
const exploreBaseUrl = ref('')
const requestsBaseUrl = ref('')
const hasZoomActions = queryBridge?.evaluateFeatureFlagFn('analytics-chart-zoom-actions', false)

onMounted(async () => {
  // Since this is async, it can't be in the `computed`.  Just check once, when the component mounts.
  exploreBaseUrl.value = await queryBridge?.exploreBaseUrl?.() ?? ''
  requestsBaseUrl.value = await queryBridge?.requestsBaseUrl?.() ?? ''
})

watch(() => props.definition, async () => {
  await nextTick()
  if (titleRef.value) {
    isTitleTruncated.value = titleRef.value.scrollWidth > titleRef.value.clientWidth
  }
}, { immediate: true, deep: true })

const exploreLink = computed(() => {
  // There are various factors that mean we might not need to make a go-to-explore URL.
  // For example, golden signal tiles don't show a kebab menu and often don't have a query definition.
  if (!exploreBaseUrl.value || !props.definition.query || !canShowKebabMenu.value) {
    return ''
  }

  const filters = datasourceScopedFilters.value
  const dimensions = props.definition.query.dimensions as QueryableExploreDimensions[] | QueryableAiExploreDimensions[] ?? []
  const exploreQuery: ExploreQuery | AiExploreQuery = {
    filters: filters,
    metrics: props.definition.query.metrics as ExploreAggregations[] | AiExploreAggregations[] ?? [],
    dimensions: dimensions,
    time_range: props.definition.query.time_range as TimeRangeV4 || props.context.timeSpec,
    granularity: props.definition.query.granularity || chartDataGranularity.value,

  } as ExploreQuery | AiExploreQuery

  // Explore only supports API usage and LLM usage.
  const datasource = ['api_usage', 'llm_usage'].includes(props.definition.query.datasource) ? props.definition.query.datasource : 'api_usage'

  return `${exploreBaseUrl.value}?q=${JSON.stringify(exploreQuery)}&d=${datasource}&c=${props.definition.chart.type}`
})

const requestsLink = computed(() => {
  if (!requestsBaseUrl.value || !props.definition.query || !canShowKebabMenu.value) {
    return ''
  }
  const filters = [...props.context.filters, ...props.definition.query.filters ?? []]

  const requestsQuery = buildRequestsQuery(
    props.definition.query.time_range as TimeRangeV4 || props.context.timeSpec,
    filters,
  )

  return `${requestsBaseUrl.value}?q=${JSON.stringify(requestsQuery)}`
})

const csvFilename = computed<string>(() => i18n.t('csvExport.defaultFilename'))

const canShowTitleActions = computed((): boolean => (canShowKebabMenu.value && (kebabMenuHasItems.value || props.context.editable)) || !!badgeData.value)

const canShowKebabMenu = computed(() => !['golden_signals', 'top_n', 'gauge'].includes(props.definition.chart.type))

const kebabMenuHasItems = computed((): boolean => !!exploreLink.value || ('allow_csv_export' in props.definition.chart && props.definition.chart.allow_csv_export) || props.context.editable)

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
}

const componentData = computed(() => {
  // Ideally, Typescript would ensure that the prop types of the renderers match
  // the props that they're going to receive.  Unfortunately, actually doing this seems difficult.
  const component = rendererLookup[props.definition.chart.type]
  return component && {
    component,
    rendererProps: {
      query: props.definition.query,
      context: props.context,
      queryReady: props.queryReady,
      chartOptions: props.definition.chart,
      height: props.height - PADDING_SIZE * 2,
      refreshCounter: props.refreshCounter,
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
  const savedGranularity = props.definition.query.granularity
  const queryGranularity = msToGranularity(chartData.value?.meta.granularity_ms || 0)
  return isTimeSeriesChart.value && savedGranularity !== queryGranularity
})

const agedOutWarning = computed(() => {
  const currentGranularity = msToGranularity(chartData.value?.meta.granularity_ms || 0)
  const savedGranularity = props.definition.query.granularity
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

  return filters.filter(f => {
    const possibleSources = getFieldDataSources(f.field)

    return possibleSources.some((ds: string) => props.definition?.query?.datasource === ds)
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
}

const setExportModalVisibility = (val: boolean) => {
  exportModalVisible.value = val
}

const exportCsv = () => {
  setExportModalVisibility(true)
}

const buildRequestsQuery = (timeRange: TimeRangeV4, filters: AllFilters[]) => {
  return {
    filter: filters,
    timeframe: {
      timePeriodsKey: timeRange.type === 'relative' ? timeRange.time_range : 'custom',
      start: timeRange.type === 'absolute' ? timeRange.start : undefined,
      end: timeRange.type === 'absolute' ? timeRange.end : undefined,
    },
  }
}

const onViewRequests = (timeRange: AbsoluteTimeRangeV4) => {
  if (!requestsBaseUrl.value || !props.definition.query) {
    return
  }

  const filters = [...props.context.filters, ...props.definition.query.filters ?? []]
  const requestsQuery = buildRequestsQuery(timeRange, filters)

  window.location.assign(`${requestsBaseUrl.value}?q=${JSON.stringify(requestsQuery)}`)
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
