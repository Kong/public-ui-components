import { inject } from 'vue'
import { FEATURE_FLAG_EVALUATOR_PROVIDER } from '../constants'

export type FeatureFlagEvaluator<T = boolean> = (key: string, defaultValue: T) => T

const defaultEvaluator: FeatureFlagEvaluator = () => false

export function useEvaluateFeatureFlag() {
  const evaluator = inject(FEATURE_FLAG_EVALUATOR_PROVIDER, defaultEvaluator)

  return evaluator
}
