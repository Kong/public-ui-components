<template>
  <div class="field-wrapper">
    <Base v-model="fieldValue" />
  </div>
</template>

<script lang="ts" setup>
import Base from './Base.vue'
import { toRef, type WritableComputedRef } from 'vue'
import { composables as formComposables } from '@kong-ui-public/forms'
import type { IdentityRealmItem } from './types'

const props = defineProps<{
  disabled?: boolean
  formOptions?: Record<string, any>
  model?: Record<string, any>
  schema: Record<string, any>
  vfg: Record<string, any>
  errors?: any[]
  hint?: string
}>()

const emit = defineEmits<{
  (event: 'modelUpdated', value: any, model: Record<string, any>): void
}>()

// `model` and the returned `value` ref are typed against forms' copy of vue, which currently
// resolves to a different patch version than this package's vue. Each copy has its own `RefSymbol`,
// so the ref types don't line up across the package boundary (TS2740/TS2741). Cast to this package's
// vue types to bridge them until the workspace shares a single vue version again.
const { clearValidationErrors, value } = formComposables.useAbstractFields<IdentityRealmItem[]>({
  model: toRef(() => props.model) as any,
  schema: props.schema,
  formOptions: props.formOptions,
  emitModelUpdated: (data: { value: any, model: Record<string, any> }): void => {
    emit('modelUpdated', data.value, data.model)
  },
})

const fieldValue = value as unknown as WritableComputedRef<IdentityRealmItem[]>

defineExpose({
  clearValidationErrors,
})
</script>

<style lang="scss" scoped>
.field-wrapper {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}
</style>
