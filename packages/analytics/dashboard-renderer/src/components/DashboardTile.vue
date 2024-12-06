<template>
  <div
    class="tile-boundary"
  >
    <div
      v-if="hasKebabMenuAccess && definition.chart.type !== 'slottable'"
      class="tile-header"
    >
      <div class="title">
        {{ definition.chart.chartTitle }}
      </div>
      <div
        v-if="canShowKebabMenu"
        class="tile-actions"
      >
        <EditIcon
          v-if="context.editable"
          class="edit-icon"
          :color="KUI_COLOR_TEXT_NEUTRAL"
          :size="KUI_ICON_SIZE_40"
          @click="editTile"
        />
        <KDropdown
          class="dropdown"
          data-testid="chart-action-menu"
          :kpop-attributes="{ placement: 'bottom-end' }"
        >
          <MoreIcon
            class="kebab-action-menu"
            :color="KUI_COLOR_TEXT_NEUTRAL"
            data-testid="kebab-action-menu"
            :size="KUI_ICON_SIZE_40"
          />
          <template #items>
            <KDropdownItem
              v-if="!!exploreLink"
              data-testid="chart-jump-to-explore"
              :item="{ label: i18n.t('jumpToExplore'), to: exploreLink }"
            />
            <KDropdownItem
              v-if="'allowCsvExport' in definition.chart && definition.chart.allowCsvExport"
              class="chart-export-button"
              data-testid="chart-csv-export"
              @click="exportCsv()"
            >
              <span
                class="chart-export-trigger"
                data-testid="csv-export-button"
              >
                {{ i18n.t('csvExport.exportAsCsv') }}
              </span>
            </KDropdownItem>
          </template>
        </KDropdown>
      </div>
      <div
        v-else-if="'description' in definition.chart"
        class="header-description"
      >
        {{ definition.chart.description }}
      </div>
      <CsvExportModal
        v-if="exportModalVisible"
        :chart-data="(chartData as ExploreResultV4)"
        :filename="csvFilename"
        @toggle-modal="setExportModalVisibility"
      />
    </div>
    <div class="tile-content">
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
import type { DashboardRendererContextInternal, DashboardTileType, TileDefinition } from '../types'
import type {
  Component,
} from 'vue'
import { computed, inject, ref } from 'vue'
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

const PADDING_SIZE = parseInt(KUI_SPACE_70, 10)

const props = withDefaults(defineProps<{
  definition: TileDefinition,
  context: DashboardRendererContextInternal,
  height?: number,
  queryReady: boolean,
  refreshCounter: number,
}>(), {
  height: DEFAULT_TILE_HEIGHT,
})

const emit = defineEmits<{
  (e: 'edit-tile', tile: TileDefinition): void
}>()

const queryBridge: AnalyticsBridge | undefined = inject(INJECT_QUERY_PROVIDER)
const { evaluateFeatureFlag } = composables.useEvaluateFeatureFlag()
const { i18n } = composables.useI18n()
const hasKebabMenuAccess = evaluateFeatureFlag('ma-3043-analytics-chart-kebab-menu', false)

const chartData = ref<ExploreResultV4>()
const exportModalVisible = ref<boolean>(false)

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

const chartDataGranularity = computed(() => {
  return chartData.value ? msToGranularity(chartData.value.meta.granularity_ms) : undefined
})

const editTile = () => {
  emit('edit-tile', props.definition)
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

  .tile-header {
    align-items: center;
    display: flex;
    justify-content: space-between;
    margin-bottom: var(--kui-space-30, $kui-space-30);
    right: 0;
    width: 100%;

    .title {
      font-weight: var(--kui-font-weight-bold, $kui-font-weight-bold);
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
  }
}
</style>
