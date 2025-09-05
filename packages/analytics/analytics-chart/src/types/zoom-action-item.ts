import type { AbsoluteTimeRangeV4 } from '@kong-ui-public/analytics-utilities'

export interface ZoomActionItem {
  label: string
  key: string
  action?: (newTimeRange: AbsoluteTimeRangeV4) => void
  href?: string
  disabled?: boolean
}
