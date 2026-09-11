import type { ResultMetaBase } from '@kong-ui-public/analytics-utilities'

export type SharedMeta = Partial<ResultMetaBase> & {
  metricNames?: string[]
  metricUnits?: Record<string, string | undefined>
}
