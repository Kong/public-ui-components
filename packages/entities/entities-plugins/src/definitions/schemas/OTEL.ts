import type { OTELSchema } from '../../types/plugins/otel'
import { isEqual } from 'lodash-es'

export const otelSchema: OTELSchema = {
  shamefullyTransformPayload(params) {

    // Non-3.14 version, skip transformation
    if (!params.payload.config?.access_logs?.custom_attributes_by_lua) {
      return params
    }

    // Clean up empty `custom_attributes_by_lua`
    if (isEqual(params.payload.config?.access_logs?.custom_attributes_by_lua, {})) {
      const accessLogs = params.payload.config?.access_logs as
        | { custom_attributes_by_lua?: Record<string, unknown> | null }
        | undefined
      if (accessLogs) {
        accessLogs.custom_attributes_by_lua = null
      }
    }

    return params
  },
}
