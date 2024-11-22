<template>
  <div
    class="tile-boundary"
    @mouseenter="showKebabMenu = true"
    @mouseleave="showKebabMenu = false"
  >
    <div
      v-if="hasKebabMenuAccess && definition.chart.type !== 'slottable'"
      class="tile-header"
    >
      <div class="title">
        {{ definition.chart.chartTitle }}
      </div>
      <KDropdown
        v-if="canShowKebabMenu"
        class="dropdown"
        data-testid="chart-action-menu"
      >
        <button
          appearance="none"
          class="kebab-action-menu"
          data-testid="kebab-action-menu"
        >
          <MoreIcon
            :color="KUI_COLOR_TEXT_NEUTRAL"
            :size="KUI_ICON_SIZE_40"
          />
        </button>
        <template #items>
          <KDropdownItem
            v-if="!!exploreLink"
            data-testid="chart-jump-to-explore"
          >
            <a :href="exploreLink">
              {{ i18n.t('jumpToExplore') }}
            </a>
          </KDropdownItem>
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
          <KDropdownItem
            v-if="context.editable"
            @click="editTile"
          >
            {{ i18n.t('renderer.edit') }}
          </KDropdownItem>
        </template>
      </KDropdown>
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
    <component
      :is="componentData.component"
      v-if="componentData"
      v-bind="componentData.rendererProps"
      @chart-data="onChartData"
    />
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
import { MoreIcon } from '@kong/icons'
import type { AiExploreAggregations, AiExploreQuery, AnalyticsBridge, ExploreAggregations, ExploreQuery, ExploreResultV4, QueryableAiExploreDimensions, QueryableExploreDimensions, TimeRangeV4 } from '@kong-ui-public/analytics-utilities'
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
const showKebabMenu = ref(false)

const exploreLink = computed(() => {
  if (queryBridge && queryBridge.exploreBaseUrl) {
    const exploreQuery: ExploreQuery | AiExploreQuery = {
      filters: [...props.context.filters, ...props.definition.query.filters ?? []],
      metrics: props.definition.query.metrics as ExploreAggregations[] | AiExploreAggregations[] ?? [],
      dimensions: props.definition.query.dimensions as QueryableExploreDimensions[] | QueryableAiExploreDimensions[] ?? [],
      time_range: props.definition.query.time_range as TimeRangeV4 || props.context.timeSpec,

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
        background: $kui-color-background-transparent;
        border: none;
        color: inherit;
        cursor: pointer;
        height: 100%;
        opacity: v-bind('showKebabMenu ? 1 : 0');
        transform: fade(0, -10px);
        transition: opacity 0.3s ease, transform 0.3s ease, visibility 0.3s;
        visibility: v-bind('showKebabMenu ? "visible" : "hidden"');
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
}
</style>
