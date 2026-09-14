import { useFormShared } from '@kong-ui-public/freeform'
import { watch } from 'vue'

import type { ComputedRef, Ref } from 'vue'

/**
 * Host opt-out via plugin context: when `enabled` is `false`, strips a schema-computed default
 * for `config.<fieldName>` so a field the host hid from the UI can't be silently submitted.
 * Only strips computed defaults (`isSchemaDefaulted`), never real data from an edit-load or a
 * clone-to-create flow — see the field-by-field precedent this generalizes in
 * key-auth/basic-auth's `ConfigFormContent.vue` and `OpenidConnectForm.vue`.
 */
export function useContextDisabledField(fieldName: string, enabled: Ref<boolean> | ComputedRef<boolean>): void {
  const { formData, isSchemaDefaulted } = useFormShared()

  watch(() => formData.config?.[fieldName], (value) => {
    if (value === undefined || !isSchemaDefaulted.value || enabled.value) return
    delete formData.config![fieldName]
  }, { immediate: true })
}
