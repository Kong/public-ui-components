<template>
  <Form
    class="rc-config-form"
    :data="data"
    :prepare-form-data="prepareFormData"
    :schema="schema"
    tag="div"
    @change="onChange"
  >
    <CalloutsForm />
    <UpstreamForm />
    <CacheForm />
  </Form>
</template>

<script setup lang="ts">
import { cloneDeep } from 'lodash-es'
import CalloutsForm from './CalloutsForm.vue'
import UpstreamForm from './UpstreamForm.vue'
import Form from '../shared/Form.vue'
import CacheForm from './CacheForm.vue'

import type { Callout, RequestCallout } from './types'
import type { FormSchema } from '../../../types/plugins/form-schema'
import { getCalloutId } from './utils'

defineProps<{
  schema: FormSchema
  data?: RequestCallout
}>()

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
  const config = cloneDeep(data)
  const { callouts } = config

  callouts.forEach((callout) => {
    // https://konghq.atlassian.net/browse/KAG-6676
    callout.request.body.custom = callout.request.body.custom ?? {}
    callout._id = getCalloutId()
  })

  const nameMap = getNameMap(callouts, true)

  callouts.forEach((callout) => {
    callout.depends_on = callout.depends_on.map((name) => nameMap[name])
  })

  return config
}

const onChange = (newVal: RequestCallout) => {
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
}
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
