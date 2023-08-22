import type { MetricCardDef } from '@kong-ui-public/metric-cards'
import type { Ref } from 'vue'
import { computed } from 'vue'
import type { ChronologicalMappedMetrics } from './useMetricFetcher'
import { DEFAULT_KEY } from './useMetricFetcher'

export interface BuilderOptions {
  title: Ref<string>,
  record: Ref<ChronologicalMappedMetrics>,
  hasError: Ref<boolean>,
  lookupKey?: string,
  sumGroupedValues?: string[],
  increaseIsBad?: boolean,
  formatValueFn?: (rawValue: number) => string,
}

export const sumValues = (recordValue: ChronologicalMappedMetrics, period: 'current' | 'previous', dimensionLookupKey: string | typeof DEFAULT_KEY = DEFAULT_KEY, sumGroupedValues?: string[]) => {
  const groupedValueKey: string[] | (typeof DEFAULT_KEY)[] = sumGroupedValues ?? [DEFAULT_KEY]

  // @ts-ignore: TS can't seem to handle the fact that `groupedValueKey` has a union type.
  return groupedValueKey.reduce((acc: number, lookup: string | typeof DEFAULT_KEY) => {
    const groupValue = recordValue[period][dimensionLookupKey]
    if (groupValue) {
      return acc + (groupValue[lookup] || 0)
    }

    return acc
  }, 0)
}

export default function useMetricCardBuilder(opts: BuilderOptions): Ref<MetricCardDef> {
  const {
    title,
    record,
    hasError,
    increaseIsBad,
    formatValueFn,
  } = opts

  return computed<MetricCardDef>(() => {
    let currentValue = 0
    let previousValue = 0

    if (record?.value) {
      try {
        currentValue = sumValues(record.value, 'current', opts.lookupKey, opts.sumGroupedValues)
        previousValue = sumValues(record.value, 'previous', opts.lookupKey, opts.sumGroupedValues)
      } catch (e) {
        // Values default to 0 if this happens.
        console.error(
          "Metric card data doesn't have the expected structure:",
          e,
        )
      }
    }

    return {
      hasError: hasError.value,
      currentValue,
      previousValue,
      title: title.value,
      increaseIsBad: !!increaseIsBad, // Coerce undefined to false
      formatValueFn,
    }
  })
}
