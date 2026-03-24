import { computed, onMounted, ref, watch } from 'vue'
import { msToGranularity } from '@kong-ui-public/analytics-utilities'
import { useAnalyticsConfigStore, useDatasourceConfigStore } from '@kong-ui-public/analytics-config-store'
import { storeToRefs } from 'pinia'
import type { DeepReadonly, Ref } from 'vue'
import type { AiExploreAggregations, AiExploreQuery, AllFilters, ExploreAggregations, ExploreQuery, ExploreResultV4, QueryableAiExploreDimensions, QueryableExploreDimensions, TimeRangeV4 } from '@kong-ui-public/analytics-utilities'
import type { AnalyticsBridge, TileDefinition } from '@kong-ui-public/analytics-utilities'
import type { DashboardRendererContextInternal } from '../types'
import type { ExternalLink } from '@kong-ui-public/analytics-chart'

const EXPLORE_DATASOURCES = [
  'basic',
  'api_usage',
  'llm_usage',
  'agentic_usage',
  'platform',
  undefined,
] as const

export default function useContextLinks(
  {
    queryBridge,
    context,
    definition,
    chartData,
  }: {
    queryBridge: AnalyticsBridge | undefined
    context: Readonly<Ref<DeepReadonly<DashboardRendererContextInternal>>>
    definition: Readonly<Ref<DeepReadonly<TileDefinition>>>
    chartData: Readonly<Ref<DeepReadonly<ExploreResultV4 | undefined>>>
  },
) {

  const exploreBaseUrl = ref('')
  const requestsBaseUrl = ref('')
  const requestsLinkZoomActions = ref<ExternalLink | undefined>(undefined)
  const exploreLinkZoomActions = ref<ExternalLink | undefined>(undefined)

  const analyticsConfigStore = useAnalyticsConfigStore()
  const datasourceConfigStore = useDatasourceConfigStore()
  const { getFieldDataSources } = storeToRefs(datasourceConfigStore)
  const datasourceConfigReady = ref(false)

  onMounted(async () => {
    // Since this is async, it can't be in the `computed`.  Just check once, when the component mounts.
    exploreBaseUrl.value = await queryBridge?.exploreBaseUrl?.() ?? ''
    requestsBaseUrl.value = await queryBridge?.requestsBaseUrl?.() ?? ''
    await datasourceConfigStore.isReady()
    datasourceConfigReady.value = true
  })

  const isAdvancedAnalytics = computed(() => analyticsConfigStore.analytics && analyticsConfigStore.percentiles)
  const canShowKebabMenu = computed(() => {
    const chartType = definition.value.chart.type
    // Always hide for golden_signals and gauge
    if (['golden_signals', 'gauge'].includes(chartType)) {
      return false
    }

    if (chartType === 'top_n') {
      return context.value.editable || context.value.showTileActions
    }

    return true
  })

  const canGenerateRequestsLink = computed(() => requestsBaseUrl.value && definition.value.query && definition.value.query.datasource !== 'llm_usage' && definition.value.query.datasource !== 'platform' && isAdvancedAnalytics.value && datasourceConfigReady.value)
  const canGenerateExploreLink = computed(() => exploreBaseUrl.value && definition.value.query && EXPLORE_DATASOURCES.includes(definition.value.query.datasource as any) && isAdvancedAnalytics.value && datasourceConfigReady.value)

  const chartDataGranularity = computed(() => {
    return chartData.value ? msToGranularity(chartData.value.meta.granularity_ms) : undefined
  })

  const datasourceScopedFilters = computed(() => {
    const filters = [...context.value.filters, ...definition.value.query.filters ?? []] as AllFilters[]

    const datasource = definition.value.query?.datasource ?? 'api_usage'

    if (datasource === 'platform' || !datasourceConfigReady.value) {
      return filters
    }

    return filters.filter(f => {
      const possibleSources = getFieldDataSources.value(f.field)

      return possibleSources.some(ds => datasource === ds)
    })
  })

  const exploreLinkKebabMenu = computed(() => {
    // There are various factors that mean we might not need to make a go-to-explore URL.
    // For example, golden signal tiles don't show a kebab menu and often don't have a query definition.
    if (!canGenerateExploreLink.value || !canShowKebabMenu.value) {
      return ''
    }

    const filters = datasourceScopedFilters.value as AllFilters[]
    const timeRange = definition.value.query.time_range as TimeRangeV4 || context.value.timeSpec
    const exploreQuery = buildExploreQuery(timeRange, filters)
    return buildExploreLink(exploreQuery)
  })

  const requestsLinkKebabMenu = computed(() => {
    if (!canGenerateRequestsLink.value || !canShowKebabMenu.value) {
      return ''
    }

    const filters = datasourceScopedFilters.value as AllFilters[]

    const requestsQuery = buildRequestsQueryKebabMenu(
      definition.value.query.time_range as TimeRangeV4 || context.value.timeSpec,
      filters,
    )

    return buildRequestLink(requestsQuery)
  })

  const buildRequestLink = (requestQuery: DeepReadonly<{ filter: AllFilters[], timeframe: { timePeriodsKey: string, start?: Date | number, end?: Date | number } }>) => {
    if (!canGenerateRequestsLink.value) {
      return ''
    }
    return `${requestsBaseUrl.value}?q=${JSON.stringify(requestQuery)}`
  }

  const buildRequestsQueryKebabMenu = (timeRange: TimeRangeV4, filters: DeepReadonly<AllFilters[]>) => {
    const start = chartData.value?.meta?.start ? new Date(chartData.value.meta.start) : undefined
    const end = chartData.value?.meta?.end ? new Date(chartData.value.meta.end) : undefined

    return {
      filter: filters,
      timeframe: {
        timePeriodsKey: timeRange.type === 'relative' ? timeRange.time_range : 'custom',
        start: timeRange.type === 'absolute' ? start : undefined,
        end: timeRange.type === 'absolute' ? end : undefined,
      },
    }
  }

  const buildRequestsQueryZoomActions = (timeRange: TimeRangeV4, filters: DeepReadonly<AllFilters[]>) => {
    return {
      filter: filters,
      timeframe: {
        timePeriodsKey: timeRange.type === 'relative' ? timeRange.time_range : 'custom',
        start: timeRange.type === 'absolute' ? timeRange.start : undefined,
        end: timeRange.type === 'absolute' ? timeRange.end : undefined,
      },
    }
  }

  const buildExploreQuery = (timeRange: TimeRangeV4, filters: DeepReadonly<AllFilters[]>) => {
    const dimensions = definition.value.query.dimensions as QueryableExploreDimensions[] | QueryableAiExploreDimensions[] ?? []
    const exploreQuery: ExploreQuery | AiExploreQuery = {
      filters: filters,
      metrics: definition.value.query.metrics as ExploreAggregations[] | AiExploreAggregations[] ?? [],
      dimensions: dimensions,
      time_range: timeRange,
      granularity: definition.value.query.granularity || chartDataGranularity.value,
    } as ExploreQuery | AiExploreQuery

    return exploreQuery
  }

  const buildExploreLink = (exploreQuery: ExploreQuery | AiExploreQuery) => {
    if (!canGenerateExploreLink.value) {
      return ''
    }

    // `basic` and unset datasources are issued through api_usage.
    const datasource = definition.value.query.datasource && definition.value.query.datasource !== 'basic'
      ? definition.value.query.datasource
      : 'api_usage'

    return `${exploreBaseUrl.value}?q=${JSON.stringify(exploreQuery)}&d=${datasource}&c=${definition.value.chart.type}`
  }


  // Need to initialize zoom-action links when they become available.
  // If we leave them as `undefined` AnalyticsChart will never be able to
  // register the dragSelect plugin.
  watch([canGenerateRequestsLink, canGenerateExploreLink], ([canGenerateRequestsLink, canGenerateExploreLink]) => {
    if (canGenerateRequestsLink) {
      requestsLinkZoomActions.value = { href: '' }
    }
    if (canGenerateExploreLink) {
      exploreLinkZoomActions.value = { href: '' }
    }
  })

  return {
    exploreLinkKebabMenu,
    requestsLinkKebabMenu,
    canShowKebabMenu,
    canGenerateRequestsLink,
    canGenerateExploreLink,
    requestsLinkZoomActions,
    exploreLinkZoomActions,
    buildExploreQuery,
    buildRequestsQueryZoomActions,
    buildExploreLink,
    buildRequestLink,
  }
}
