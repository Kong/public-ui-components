<template>
  <div class="rc-config-form">
    <CalloutsForm />
    <UpstreamForm />
    <CacheForm />
  </div>
</template>

<script setup lang="ts">
import { reactive, watch, provide } from 'vue'
import CalloutsForm from './CalloutsForm.vue'
import UpstreamForm from './UpstreamForm.vue'

import type { RequestCallout } from './types'
import { DATA_INJECTION_KEY, SCHEMA_INJECTION_KEY, useSchemaMap } from './composables'
import { getDefaultRequestCallout } from './utils'
import CacheForm from './CacheForm.vue'

const props = defineProps<{
  schema: Record<string, any>
}>()

const formData = reactive<RequestCallout>(getDefaultRequestCallout())
provide(DATA_INJECTION_KEY, formData)

const { getSchemaByPath } = useSchemaMap(() => props.schema)
provide(SCHEMA_INJECTION_KEY, getSchemaByPath)

const emit = defineEmits<{
  change: [value: RequestCallout]
}>()

watch(formData, (newVal) => {
  emit('change', newVal)
}, { deep: true })
</script>

<style lang="scss" scoped>
:deep(.rc-code textarea) {
  font-family: $kui-font-family-code !important;
}

:deep(.k-label) {
  font-weight: $kui-font-weight-medium;
}

.rc-config-form {
  display: flex;
  flex-direction: column;
  gap: $kui-space-100;
}
</style>
