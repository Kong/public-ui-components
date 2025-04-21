<template>
  <Form
    class="rc-config-form"
    :config="formConfig"
    :data="data"
    :schema="schema"
    tag="div"
    @change="onChange"
  >
    <!-- global field templates -->
    <template #[FIELD_RENDERERS]>
      <!-- A render template for `by_lua` fields in any level -->
      <FieldRenderer
        v-slot="props"
        :match="({ path }) => path.endsWith('by_lua')"
      >
        <StringField
          v-bind="props"
          autosize
          class="rc-code"
          multiline
          :placeholder="t('plugins.free-form.request-callout.by_lua_placeholder')"
        />
      </FieldRenderer>

      <!-- A renderer template for array fields which need appearance="card" prop -->
      <FieldRenderer
        v-slot="props"
        :match="({ path }) => ['cluster_nodes', 'sentinel_nodes']
          .some(n => path.endsWith(n))"
      >
        <ArrayField
          v-bind="props"
          appearance="card"
        />
      </FieldRenderer>
    </template>

    <CalloutsForm />

    <ObjectField
      appearance="card"
      name="upstream"
    />

    <ObjectField
      appearance="card"
      name="cache"
    />
  </Form>
</template>

<script setup lang="ts">
import { cloneDeep } from 'lodash-es'
import { FIELD_RENDERERS } from '../shared/composables'
import { getCalloutId } from './utils'
import ArrayField from '../shared/ArrayField.vue'
import CalloutsForm from './CalloutsForm.vue'
import FieldRenderer from '../shared/FieldRenderer.vue'
import Form from '../shared/Form.vue'
import ObjectField from '../shared/ObjectField.vue'
import StringField from '../shared/StringField.vue'
import useI18n from '../../../composables/useI18n'

import type { Callout, RequestCallout } from './types'
import type { FormConfig } from '../shared/types'
import type { FormSchema } from '../../../types/plugins/form-schema'

defineProps<{
  schema: FormSchema
  data?: RequestCallout
}>()

const emit = defineEmits<{
  change: [value: RequestCallout]
}>()

const formConfig: FormConfig = {
  prepareFormData,
}

const { i18n: { t } } = useI18n()

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
