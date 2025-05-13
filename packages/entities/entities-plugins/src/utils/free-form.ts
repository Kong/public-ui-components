import type { FeatureFlagEvaluator } from '../composables/useEvaluateFeatureFlag'

export function getFreeFormName(modelName: string, ffEvaluator: FeatureFlagEvaluator): string | undefined {
  const mapping: Record<string, string | { component: string, featureFlag: string }> = {
    'request-callout': 'RequestCalloutForm',
    'service-protection': {
      component: 'ServiceProtectionForm',
      featureFlag: 'KM-1265-enhanced-service-protection-ui',
    },
  }

  const matched = mapping[modelName]

  if (typeof matched === 'string') {
    return matched
  } else if (ffEvaluator(matched.featureFlag, false)) {
    return matched.component
  }
}
