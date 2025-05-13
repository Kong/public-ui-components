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

      <!-- Set appearance to `cluster_nodes` and `sentinel_nodes` -->
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

      <!-- Example of using redis selector -->
      <!-- <FieldRenderer
        v-slot="props"
        :match="({ path }) => path.endsWith('redis')"
      >
        <RedisSelector
          v-bind="props"
        />
      </FieldRenderer> -->
    </template>

    <ObjectField
      as-child
      name="config"
      reset-label-path="reset"
    >
      <CalloutsForm />

      <ObjectField
        appearance="card"
        :fields-order="['headers', 'query', 'body', 'by_lua']"
        name="upstream"
      />

      <ObjectField
        appearance="card"
        name="cache"
      >
        <template #[`redis`]="props">
          <ObjectField
            v-bind="props"
            :fields-order="[
              'host', 'port', 'connection_is_proxied', 'database', 'username', 'password',
              'sentinel_master', 'sentinel_role', 'sentinel_nodes', 'sentinel_username', 'sentinel_password',
              'cluster_nodes', 'cluster_max_redirections', 'ssl', 'ssl_verify', 'server_name',
              'keepalive_backlog', 'keepalive_pool_size', 'read_timeout', 'send_timeout', 'connect_timeout'
            ]"
          />
        </template>
      </ObjectField>
    </ObjectField>
  </Form>
</template>

<script setup lang="ts">
import { cloneDeep, pick } from 'lodash-es'
import { FIELD_RENDERERS } from '../shared/composables'
import { getCalloutId } from './utils'
import ArrayField from '../shared/ArrayField.vue'
import CalloutsForm from './CalloutsForm.vue'
import FieldRenderer from '../shared/FieldRenderer.vue'
import Form from '../shared/Form.vue'
import ObjectField from '../shared/ObjectField.vue'
import StringField from '../shared/StringField.vue'
// import RedisSelector from '../shared/RedisSelector.vue'
import useI18n from '../../../composables/useI18n'

import type { Callout, RequestCalloutPlugin } from './types'
import type { FormConfig } from '../shared/types'
import type { FormSchema } from '../../../types/plugins/form-schema'

defineProps<{
  schema: FormSchema
  data?: RequestCalloutPlugin
}>()

const emit = defineEmits<{
  change: [value: RequestCalloutPlugin]
}>()

const formConfig: FormConfig<RequestCalloutPlugin> = {
  prepareFormData,
  hasValue,
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
function prepareFormData(data: RequestCalloutPlugin) {
  const pluginConfig = pick(cloneDeep(data), 'config', 'partials')

  if (!pluginConfig.config?.callouts) {
    return pluginConfig
  }

  const { callouts } = pluginConfig.config

  callouts.forEach((callout) => {
    // https://konghq.atlassian.net/browse/KAG-6676
    callout.request.body.custom = callout.request.body.custom ?? {}
    callout._id = getCalloutId()
  })

  const nameMap = getNameMap(callouts, true)

  callouts.forEach((callout) => {
    callout.depends_on = callout.depends_on.map((name) => nameMap[name])
  })

  return pluginConfig
}

/**
 * Check if the initial data is empty
 */
function hasValue(data: RequestCalloutPlugin | undefined): boolean {
  return !!data?.config
}

function onChange(newVal?: RequestCalloutPlugin) {
  if (!newVal) return

  // replace callout `depends_on` ids with actual callout names
  const pluginConfig = JSON.parse(JSON.stringify(newVal)) as RequestCalloutPlugin

  if (!pluginConfig.config?.callouts) {
    throw new Error('data is not correct')
  }

  const nameMap = getNameMap(pluginConfig.config.callouts)

  pluginConfig.config.callouts = pluginConfig.config.callouts.map((callout) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _id, depends_on, ...rest } = callout
    return {
      depends_on: depends_on.map((id) => nameMap[id]).filter(name => name != null),
      ...rest,
    }
  })

  emit('change', pluginConfig)
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
