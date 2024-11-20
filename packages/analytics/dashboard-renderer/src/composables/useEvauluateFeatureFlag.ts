import type { AnalyticsBridge } from '@kong-ui-public/analytics-utilities'
import { inject } from 'vue'
import { INJECT_QUERY_PROVIDER } from '../constants'

export default function useEvaluateFeatureFlag() {

  const queryBridge: AnalyticsBridge | undefined = inject(INJECT_QUERY_PROVIDER)

  const evaluateFeatureFlag = (key: string, defaultValue: boolean) => {
    if (!queryBridge) {
      return defaultValue
    }
    return queryBridge.evaluateFeatureFlagFn(key, defaultValue)
  }

  return {
    evaluateFeatureFlag,
  }
}
