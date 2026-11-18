import { computed, inject, provide, toValue } from 'vue'
import type { InjectionKey, MaybeRefOrGetter } from 'vue'
import type { CelLanguage } from '@kong-ui-public/monaco-editor/languages/cel'

type CelInputResolver = (language: string) => { language: CelLanguage } | undefined
const celInputKey: InjectionKey<CelInputResolver> = Symbol.for('kong-ui-public:freeform:cel-input')

export function provideCelInput(resolve: CelInputResolver) {
  provide(celInputKey, resolve)
}

/** Resolve the host's CEL configuration only while this field uses the editor. */
export function useCelInput(language: string, enabled: MaybeRefOrGetter<boolean> = true) {
  const resolve = inject(celInputKey, undefined)
  return computed(() => toValue(enabled) ? resolve?.(language) : undefined)
}
