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

import type { Callout, RequestCallout } from './types'
import { DATA_INJECTION_KEY, SCHEMA_INJECTION_KEY, useSchemaHelpers } from '../shared/composables'
import CacheForm from './CacheForm.vue'
import { getCalloutId } from './utils'

const props = defineProps<{
  schema: Record<string, any>
  data?: RequestCallout
}>()

const schemaHelpers = useSchemaHelpers(() => props.schema)
provide(SCHEMA_INJECTION_KEY, schemaHelpers)

const formData = reactive<RequestCallout>(prepareFormData(props.data || schemaHelpers.getDefault()))
provide(DATA_INJECTION_KEY, formData)

const emit = defineEmits<{
  change: [value: RequestCallout]
}>()

function getNameMap(callouts: Callout[], reverse: boolean = false) {
  return callouts.reduce((acc, { _id, name }) => {
    if (reverse) {
      acc[name] = _id as string
    } else {
      acc[_id as string] = name
    }
    return acc
  }, {} as Record<string, string>)
}

// replace callout names in `depends_on` with freshly generated ids
function prepareFormData(data: RequestCallout) {
  const callouts = data.callouts.map((callout) => {
    return {
      ...callout,
      _id: getCalloutId(),
    }
  })

  const nameMap = getNameMap(callouts, true)

  callouts.forEach((callout) => {
    callout.depends_on = callout.depends_on.map((name) => nameMap[name])
  })

  return {
    ...data,
    callouts,
  }
}

watch(formData, (newVal) => {
  // replace callout `depends_on` ids with actual callout names
  const data = JSON.parse(JSON.stringify(newVal)) as RequestCallout
  const nameMap = getNameMap(data.callouts)

  data.callouts = data.callouts.map((callout) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _id, depends_on, ...rest } = callout
    return {
      depends_on: depends_on.map((id) => nameMap[id]).filter(name => name != null),
      ...rest,
    }
  })

  emit('change', data)
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
