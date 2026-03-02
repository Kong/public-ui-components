<template>
  <StandardLayout
    v-bind="props"
    :form-config="formConfig"
    :on-form-change="handleFormChange"
  >
    <template #field-renderers>
      <!-- A render template for `by_lua` fields in any level -->
      <FieldRenderer
        v-slot="rendererProps"
        :match="({ path }) => path.endsWith('by_lua')"
      >
        <StringField
          v-bind="rendererProps"
          autosize
          class="rc-code"
          multiline
          :placeholder="t('plugins.free-form.request-callout.by_lua_placeholder')"
        />
      </FieldRenderer>

      <!-- Set appearance to `cluster_nodes` and `sentinel_nodes` -->
      <FieldRenderer
        v-slot="rendererProps"
        :match="({ path }) => ['cluster_nodes', 'sentinel_nodes']
          .some(n => path.endsWith(n))"
      >
        <ArrayField
          v-bind="rendererProps"
          appearance="card"
        />
      </FieldRenderer>
    </template>

    <ConfigForm />
  </StandardLayout>
</template>

<script setup lang="ts">
import { AUTOFILL_SLOT, AUTOFILL_SLOT_NAME } from '@kong-ui-public/forms'
import { provide } from 'vue'
import { cloneDeep } from 'lodash-es'
import ConfigForm from './ConfigForm.vue'
import StandardLayout from '../shared/layout/StandardLayout.vue'
import ArrayField from '../shared/ArrayField.vue'
import FieldRenderer from '../shared/FieldRenderer.vue'
import StringField from '../shared/StringField.vue'
import useI18n from '../../../composables/useI18n'
import { getCalloutId } from './utils'

import type { Props } from '../shared/layout/StandardLayout.vue'
import type { FormConfig } from '../shared/types'
import { CalloutId, type Callout, type RequestCalloutPlugin } from './types'

const props = defineProps<Props>()

const slots = defineSlots<{
  [K in typeof AUTOFILL_SLOT_NAME]: () => any
}>()

provide(AUTOFILL_SLOT, slots?.[AUTOFILL_SLOT_NAME])

const { i18n: { t } } = useI18n()

function getNameMap(callouts: Callout[], reverse: boolean = false) {
  return callouts.reduce((acc, { [CalloutId]: id, name }) => {
    if (reverse) {
      acc[name] = id as string
    } else {
      acc[id as string] = name
    }
    return acc
  }, {} as Record<string, string>)
}

function getScopesFromFormModel(): Record<string, any> {
  const data: Record<string, any> = {}
  const scopeModelFields = ['service-id', 'route-id', 'consumer-id', 'consumer_group-id']
  for (const field of scopeModelFields) {
    if (props.formModel[field]) {
      const name = field.split('-')[0]
      if (name) {
        data[name] = { id: props.formModel[field] }
      }
    }
  }
  return data
}

// Replace callout names in `depends_on` with freshly generated ids
function prepareFormData(data: RequestCalloutPlugin) {
  const pluginConfig = cloneDeep(data)

  if (pluginConfig.config?.callouts) {
    const { callouts } = pluginConfig.config

    callouts.forEach((callout) => {
      // https://konghq.atlassian.net/browse/KAG-6676
      callout.request.body.custom = callout.request.body.custom ?? {}
      callout[CalloutId] = getCalloutId()
    })

    const nameMap = getNameMap(callouts, true)

    callouts.forEach((callout) => {
      callout.depends_on = callout.depends_on.map((name) => nameMap[name])
    })
  }

  if (!props.isEditing) {
    return { ...pluginConfig, ...getScopesFromFormModel() } as RequestCalloutPlugin
  }

  return pluginConfig
}

const formConfig: FormConfig<RequestCalloutPlugin> = {
  hasValue: (data?: RequestCalloutPlugin): boolean => !!data && Object.keys(data).length > 0,
  prepareFormData,
}

function handleFormChange(value: Partial<RequestCalloutPlugin>, fields?: string[]) {
  if (!value) return

  // Replace callout `depends_on` ids with actual callout names
  const pluginConfig = cloneDeep(value) as RequestCalloutPlugin

  if (!pluginConfig.config?.callouts) {
    throw new Error('data is not correct')
  }

  const nameMap = getNameMap(pluginConfig.config.callouts)

  pluginConfig.config.callouts = pluginConfig.config.callouts.map((callout) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { [CalloutId]: id, depends_on, ...rest } = callout
    return {
      depends_on: depends_on.map((id) => nameMap[id]).filter(name => name != null),
      ...rest,
    }
  })

  props.onFormChange(pluginConfig, fields)
}
</script>

<style lang="scss" scoped>
.rc-code :deep(textarea) {
  font-family: $kui-font-family-code !important;
}
</style>
