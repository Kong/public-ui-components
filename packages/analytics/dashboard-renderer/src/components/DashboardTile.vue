<template>
  <div
    class="tile-boundary"
    :class="{ 'editable': context.editable }"
    :data-testid="`tile-${tileId}`"
  >
    <div
      v-if="hasKebabMenuAccess && definition.chart.type !== 'slottable'"
      class="tile-header"
    >
      <KTooltip
        class="title-tooltip"
        :disabled="!isTitleTruncated"
        max-width="500"
        :text="definition.chart.chartTitle"
      >
        <div
          ref="titleRef"
          class="title"
        >
          {{ definition.chart.chartTitle }}
        </div>
      </KTooltip>
      <div
        v-if="canShowKebabMenu || badgeData"
        class="tile-actions"
        :data-testid="`tile-actions-${tileId}`"
      >
        <KBadge v-if="badgeData">
          {{ badgeData }}
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
          v-if="canShowKebabMenu"
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
              v-if="'allowCsvExport' in definition.chart && definition.chart.allowCsvExport"
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
              :data-testid="`remove-tile-${tileId}`"
              @click="removeTile"
            >
              {{ i18n.t('renderer.remove') }}
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
      />
    </div>
  </div>
</template>
<script setup lang="ts">
import type { DashboardRendererContextInternal } from '../types'
import { type DashboardTileType, formatTime, type TileDefinition, TimePeriods } from '@kong-ui-public/analytics-utilities'
import { type Component, computed, inject, nextTick, ref, watch } from 'vue'
import '@kong-ui-public/analytics-chart/dist/style.css'
import '@kong-ui-public/analytics-metric-provider/dist/style.css'
import SimpleChartRenderer from './SimpleChartRenderer.vue'
import BarChartRenderer from './BarChartRenderer.vue'
import { DEFAULT_TILE_HEIGHT, INJECT_QUERY_PROVIDER } from '../constants'
import TimeseriesChartRenderer from './TimeseriesChartRenderer.vue'
import GoldenSignalsRenderer from './GoldenSignalsRenderer.vue'
import { KUI_SPACE_70 } from '@kong/design-tokens'
import TopNTableRenderer from './TopNTableRenderer.vue'
import composables from '../composables'
import { KUI_COLOR_TEXT_NEUTRAL, KUI_ICON_SIZE_40 } from '@kong/design-tokens'
import { MoreIcon, EditIcon } from '@kong/icons'
import { msToGranularity, type AiExploreAggregations, type AiExploreQuery, type AnalyticsBridge, type ExploreAggregations, type ExploreQuery, type ExploreResultV4, type QueryableAiExploreDimensions, type QueryableExploreDimensions, type TimeRangeV4 } from '@kong-ui-public/analytics-utilities'
import { CsvExportModal } from '@kong-ui-public/analytics-chart'
import { TIMEFRAME_LOOKUP } from '@kong-ui-public/analytics-utilities'
import DoughnutChartRenderer from './DoughnutChartRenderer.vue'

const PADDING_SIZE = parseInt(KUI_SPACE_70, 10)

const props = withDefaults(defineProps<{
  definition: TileDefinition,
  context: DashboardRendererContextInternal,
  height?: number,
  queryReady: boolean,
  refreshCounter: number,
  tileId: string | number,
}>(), {
  height: DEFAULT_TILE_HEIGHT,
})

const emit = defineEmits<{
  (e: 'edit-tile', tile: TileDefinition): void
  (e: 'remove-tile', tile: TileDefinition): void
}>()

const queryBridge: AnalyticsBridge | undefined = inject(INJECT_QUERY_PROVIDER)
const { evaluateFeatureFlag } = composables.useEvaluateFeatureFlag()
const { i18n } = composables.useI18n()
const hasKebabMenuAccess = evaluateFeatureFlag('ma-3043-analytics-chart-kebab-menu', false)

const chartData = ref<ExploreResultV4>()
const exportModalVisible = ref<boolean>(false)
const titleRef = ref<HTMLElement>()
const isTitleTruncated = ref(false)

watch(() => props.definition, async () => {
  await nextTick()
  if (titleRef.value) {
    isTitleTruncated.value = titleRef.value.scrollWidth > titleRef.value.clientWidth
  }
}, { immediate: true, deep: true })

const exploreLink = computed(() => {
  if (queryBridge && queryBridge.exploreBaseUrl) {
    const exploreQuery: ExploreQuery | AiExploreQuery = {
      filters: [...props.context.filters, ...props.definition.query.filters ?? []],
      metrics: props.definition.query.metrics as ExploreAggregations[] | AiExploreAggregations[] ?? [],
      dimensions: props.definition.query.dimensions as QueryableExploreDimensions[] | QueryableAiExploreDimensions[] ?? [],
      time_range: props.definition.query.time_range as TimeRangeV4 || props.context.timeSpec,
      granularity: props.definition.query.granularity || chartDataGranularity.value,

    } as ExploreQuery | AiExploreQuery
    // Explore only supports advanced or ai
    const datasource = ['advanced', 'ai'].includes(props.definition.query.datasource) ? props.definition.query.datasource : 'advanced'
    return `${queryBridge.exploreBaseUrl()}?q=${JSON.stringify(exploreQuery)}&d=${datasource}&c=${props.definition.chart.type}`
  }

  return ''
})

const csvFilename = computed<string>(() => i18n.t('csvExport.defaultFilename'))

const canShowKebabMenu = computed(() => hasKebabMenuAccess && !['golden_signals', 'top_n', 'gauge'].includes(props.definition.chart.type))

const rendererLookup: Record<DashboardTileType, Component | undefined> = {
  'timeseries_line': TimeseriesChartRenderer,
  'timeseries_bar': TimeseriesChartRenderer,
  'horizontal_bar': BarChartRenderer,
  'vertical_bar': BarChartRenderer,
  'gauge': SimpleChartRenderer,
  'doughnut': DoughnutChartRenderer,
  'golden_signals': GoldenSignalsRenderer,
  'top_n': TopNTableRenderer,
  'slottable': undefined,
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

const editTile = () => {
  emit('edit-tile', props.definition)
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
    padding: var(--kui-space-60, $kui-space-60) var(--kui-space-60, $kui-space-60) var(--kui-space-20, $kui-space-20) var(--kui-space-60, $kui-space-60);
    right: 0;
    width: 100%;

    .title-tooltip {
      margin-right: $kui-space-20;
      overflow: hidden;

      .title {
        font-weight: var(--kui-font-weight-bold, $kui-font-weight-bold);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
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
