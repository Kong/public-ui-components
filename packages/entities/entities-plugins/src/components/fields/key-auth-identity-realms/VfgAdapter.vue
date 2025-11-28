<template>
  <div class="field-wrapper">
    <Base v-model="fieldValue" />
  </div>
</template>

<script lang="ts" setup>
import Base from './Base.vue'
import { toRef } from 'vue'
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

const { clearValidationErrors, value: fieldValue } = formComposables.useAbstractFields<IdentityRealmItem[]>({
  model: toRef(() => props.model),
  schema: props.schema,
  formOptions: props.formOptions,
  emitModelUpdated: (data: { value: any, model: Record<string, any> }): void => {
    emit('modelUpdated', data.value, data.model)
  },
})

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
