import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useFormShared } from './form-context'
import type { CelExpressionKind, FormConfig } from '../types'

export function useCelExpression(formConfig: MaybeRefOrGetter<Pick<FormConfig, 'celExpression'> | undefined> = useFormShared().config) {
  const options = computed(() => toValue(formConfig)?.celExpression)
  return {
    enabled: computed(() => options.value?.enabled ?? false),
    getSupportedLanguages: (kind: CelExpressionKind) => options.value?.enabled ? options.value.getSupportedLanguages(kind) : [],
  }
}
