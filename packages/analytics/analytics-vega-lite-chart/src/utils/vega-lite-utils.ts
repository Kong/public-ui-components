import type { ExploreResultV4 } from '@kong-ui-public/analytics-utilities'
import type { VisualizationSpec } from 'vega-embed'

export interface DatasetLabel {
  name: string
  id: string
}


export function prepareData(exploreResult: ExploreResultV4) {

  const data = exploreResult.data
  const { metric_names: metricNames } = exploreResult.meta
  if (!metricNames) {
    throw new Error('Cannot build chart data from this explore result. Missing metric names.')
  }
  const flatData: Array<{ [label: string]: string | number }> = data.flatMap(data => {
    const timestamp = new Date(data.timestamp).toISOString()
    const event = data.event as { [label: string]: string | number }

    return {
      time: timestamp,
      ...event,
    }
  })

  return flatData
}


export function createTimeSeriesVegaSpec(
  exploreResult: ExploreResultV4,
  chartType: 'line' | 'bar' | 'area' = 'line',
): VisualizationSpec {
  const { display, metric_names: metricNames, start_ms: timeMin, end_ms: timeMax } = exploreResult.meta
  if (!metricNames) {
    throw new Error('Cannot build chart data from this explore result. Missing metric names.')
  }

  const dimensionFieldNames = (display && Object.keys(display)) || metricNames
  const dimension = (dimensionFieldNames && dimensionFieldNames[0])
  const dimensionLabels = display && display[dimension]

  const hasDimensionField = dimension && dimension !== metricNames[0]

  const transformedData = prepareData(exploreResult)

  const metric = metricNames[0]

  const getYEncoding = () => {
    const baseEncoding = {
      field: hasDimensionField ? metric : 'value',
      type: 'quantitative' as const,
      title: hasDimensionField ? metric : 'Value',
    }
    return baseEncoding
  }

  return {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    width: 'container',
    height: 'container',
    datasets: {
      chartData: transformedData,
    },
    data: { name: 'chartData' },
    transform: [
      {
        fold: [...metricNames], as: ['metric', 'value'],
      },
      // {
      //   filter: 'isValid(datum.value) && isFinite(datum.value)',
      // },
    ],
    config: {
      legend: {
        disable: true,
      },
    },
    encoding: {
      x: {
        field: 'time', type: 'temporal', title: 'Time',
        axis: {
          grid: false,
        },
        scale: {
          domain: [timeMin, timeMax],
        },
      },
    },
    layer: [
      {
        'params': [{
          'name': 'brush',
          'select': { 'type': 'interval', 'encodings': ['x'] },
        }],
        'mark': 'area',
      },
      // Dataset layer
      {
        mark: {
          type: chartType,
          point: false,
          interpolate: 'linear',
        },
        encoding: hasDimensionField
          ? {
            y: getYEncoding(),
            color: {
              field: dimension, type: 'nominal', title: dimension,
              scale: { domain: Object.keys(dimensionLabels || {}) },
              legend: {
                orient: 'bottom',
                direction: 'horizontal',
                titlePadding: 5,
                labelLimit: 150,
              },
            },
          } : {
            y: getYEncoding(),
            color: {
              field: 'metric', type: 'nominal', title: 'Metrics',
              scale: { domain: [...metricNames] },
              legend: {
                orient: 'bottom',
                direction: 'horizontal',
                titlePadding: 5,
                labelLimit: 150,
              },
            },
          },
        transform: [
          {
            impute: 'value',
            key: 'time',
            ...(dimension ? { groupby: [dimension] } : {}),
            method: 'value',
            value: 0,
          },
        ],
        // Show points on hover
        layer: [
          { mark: chartType },
          { transform: [{ filter: { param: 'hover', empty: false } }], mark: 'point' },
        ],
      },
      // Vertical line and tooltip layer
      {
        transform: hasDimensionField ? [{ pivot: dimension, value: metric, groupby: ['time'] }] : [],
        mark: 'rule',
        encoding: {
          opacity: {
            condition: { value: 0.3, param: 'hover', empty: false },
            value: 0,
          },
          // tooltip: hasDimensionField
          //   ? Object.keys(dimensionLabels || {}).map((label: string) => {
          //     return { field: label, type: 'quantitative' }
          //   })
          //   : metricNames.map((metric: string) => {
          //     return { field: metric, type: 'quantitative' }
          //   }),
        },
        params: [{
          name: 'hover',
          select: {
            type: 'point',
            fields: ['time'],
            nearest: true,
            on: 'pointerover',
            clear: 'pointerout',
          },
        }],
      },
    ],
  }
}
