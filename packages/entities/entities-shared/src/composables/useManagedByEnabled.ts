import type { ComputedRef, MaybeRef } from 'vue'
import { computed, inject, toValue } from 'vue'
import { ENTITIES_FEATURE_FLAGS } from '../constants'

/**
 * Whether the host app has enabled the `managed_by` ownership field.
 *
 * Defaults to `false` so packages stay on today's behaviour until a host opts in - important
 * because the API returns `managed_by` as an object, which would otherwise render as raw JSON.
 *
 * Must be called during `setup()`.
 */
export default function useManagedByEnabled(): ComputedRef<boolean> {
  const flag = inject<MaybeRef<boolean>>(ENTITIES_FEATURE_FLAGS.MANAGED_BY, false)

  return computed((): boolean => !!toValue(flag))
}
