import type { ComputedRef, InjectionKey, MaybeRefOrGetter, Slot } from 'vue'

export const FIELD_PATH_KEY = Symbol('free-form-field-path') as InjectionKey<ComputedRef<string>>
export const FIELD_RENDERER_SLOTS = Symbol('free-form-field-renderer-slots') as InjectionKey<MaybeRefOrGetter<Record<string, Slot | undefined>>>
export const FIELD_RESET_LABEL_PATH_SETTING = Symbol('free-form-field-reset-label-path-setting') as InjectionKey<MaybeRefOrGetter<{
  parentPath: string | null
  isolate: boolean
}>>

export const FIELD_RENDERERS = 'free-form-field-renderers-slot' as const
