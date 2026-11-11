<template>
  <div>
    <EntityConfigCardView
      :config="config"
      :config-schema="configSchema"
      :entity-type="SupportedEntityType.Upstream"
      :hide-title="hideTitle"
      :record="record"
    >
      <template #name-label-tooltip>
        <i18nT
          keypath="upstreams.form.fields.name.tooltip"
          scope="global"
        >
          <template #host>
            <code>{{ t('upstreams.form.fields.name.host') }}</code>
          </template>
        </i18nT>
      </template>
      <template #hash_on-label-tooltip="{ row }">
        <i18nT
          keypath="upstreams.form.fields.hash_on.tooltip"
          scope="global"
        >
          <template #result>
            <code>{{ row.value }}</code>
          </template>
        </i18nT>
      </template>
      <template #hash_on_header-label-tooltip>
        <i18nT
          keypath="upstreams.form.hash_tooltips.hash_on_header.text"
          scope="global"
        >
          <template #hash_on>
            <code>{{ t('upstreams.form.hash_tooltips.hash_on_header.hash_on') }}</code>
          </template>
          <template #header>
            <code>{{ t('upstreams.form.hash_tooltips.hash_on_header.header') }}</code>
          </template>
        </i18nT>
      </template>
      <template #hash_on_uri_capture-label-tooltip>
        <i18nT
          keypath="upstreams.form.hash_tooltips.hash_on_uri_capture.text"
          scope="global"
        >
          <template #hash_on>
            <code>{{ t('upstreams.form.hash_tooltips.hash_on_uri_capture.hash_on') }}</code>
          </template>
          <template #uri_capture>
            <code>{{ t('upstreams.form.hash_tooltips.hash_on_uri_capture.uri_capture') }}</code>
          </template>
        </i18nT>
      </template>
      <template #hash_on_query_arg-label-tooltip>
        <i18nT
          keypath="upstreams.form.hash_tooltips.hash_on_query_arg.text"
          scope="global"
        >
          <template #hash_on>
            <code>{{ t('upstreams.form.hash_tooltips.hash_on_query_arg.hash_on') }}</code>
          </template>
          <template #query_arg>
            <code>{{ t('upstreams.form.hash_tooltips.hash_on_query_arg.query_arg') }}</code>
          </template>
        </i18nT>
      </template>
      <template #hash_on_cookie-label-tooltip>
        <i18nT
          keypath="upstreams.form.hash_tooltips.hash_on_cookie.text"
          scope="global"
        >
          <template #hash_on>
            <code>{{ t('upstreams.form.hash_tooltips.hash_on_cookie.hash_on') }}</code>
          </template>
          <template #hash_fallback>
            <code>{{ t('upstreams.form.hash_tooltips.hash_on_cookie.hash_fallback') }}</code>
          </template>
          <template #cookie>
            <code>{{ t('upstreams.form.hash_tooltips.hash_on_cookie.cookie') }}</code>
          </template>
        </i18nT>
      </template>
      <template #hash_on_cookie_path-label-tooltip>
        <i18nT
          keypath="upstreams.form.hash_tooltips.hash_on_cookie_path.text"
          scope="global"
        >
          <template #hash_on>
            <code>{{ t('upstreams.form.hash_tooltips.hash_on_cookie_path.hash_on') }}</code>
          </template>
          <template #hash_fallback>
            <code>{{ t('upstreams.form.hash_tooltips.hash_on_cookie_path.hash_fallback') }}</code>
          </template>
          <template #cookie>
            <code>{{ t('upstreams.form.hash_tooltips.hash_on_cookie_path.cookie') }}</code>
          </template>
        </i18nT>
      </template>
      <template #slots-label-tooltip>
        <i18nT
          keypath="upstreams.form.hash_tooltips.slots.text"
          scope="global"
        >
          <template #algorithm>
            <code>{{ t('upstreams.form.hash_tooltips.slots.algorithm') }}</code>
          </template>
          <template #round_robin>
            <code>{{ t('upstreams.form.hash_tooltips.slots.round_robin') }}</code>
          </template>
          <template #consistent_hashing>
            <code>{{ t('upstreams.form.hash_tooltips.slots.consistent_hashing') }}</code>
          </template>
          <template #min>
            <code>10</code>
          </template>
          <template #max>
            <code>65536</code>
          </template>
        </i18nT>
      </template>
      <template #hash_fallback-label-tooltip>
        <i18nT
          keypath="upstreams.form.hash_tooltips.hash_fallback.text"
          scope="global"
        >
          <template #hash_on>
            <code>{{ t('upstreams.form.hash_tooltips.hash_fallback.hash_on') }}</code>
          </template>
          <template #cookie>
            <code>{{ t('upstreams.form.hash_tooltips.hash_fallback.cookie') }}</code>
          </template>
        </i18nT>
      </template>
      <template #hash_fallback_header-label-tooltip>
        <i18nT
          keypath="upstreams.form.hash_tooltips.hash_fallback_header.text"
          scope="global"
        >
          <template #hash_fallback>
            <code>{{ t('upstreams.form.hash_tooltips.hash_fallback_header.hash_fallback') }}</code>
          </template>
          <template #header>
            <code>{{ t('upstreams.form.hash_tooltips.hash_fallback_header.header') }}</code>
          </template>
        </i18nT>
      </template>
      <template #hash_fallback_query_arg-label-tooltip>
        <i18nT
          keypath="upstreams.form.hash_tooltips.hash_fallback_query_arg.text"
          scope="global"
        >
          <template #hash_fallback>
            <code>{{ t('upstreams.form.hash_tooltips.hash_fallback_query_arg.hash_fallback') }}</code>
          </template>
          <template #query_arg>
            <code>{{ t('upstreams.form.hash_tooltips.hash_fallback_query_arg.query_arg') }}</code>
          </template>
        </i18nT>
      </template>
      <template #hash_fallback_uri_capture-label-tooltip>
        <i18nT
          keypath="upstreams.form.hash_tooltips.hash_fallback_uri_capture.text"
          scope="global"
        >
          <template #hash_fallback>
            <code>{{ t('upstreams.form.hash_tooltips.hash_fallback_uri_capture.hash_fallback') }}</code>
          </template>
          <template #uri_capture>
            <code>{{ t('upstreams.form.hash_tooltips.hash_fallback_uri_capture.uri_capture') }}</code>
          </template>
        </i18nT>
      </template>
      <template #host_header-label-tooltip>
        <i18nT
          keypath="upstreams.form.hash_tooltips.host_header.text"
          scope="global"
        >
          <template #host>
            <code>{{ t('upstreams.form.hash_tooltips.host_header.host') }}</code>
          </template>
        </i18nT>
      </template>
      <template #client_certificate="slotProps">
        <div>
          <div data-testid="client_certificate-plain-text">
            <span>{{ getPropValue('rowValue', slotProps)?.id }}</span>
          </div>
        </div>
      </template>
      <template
        v-if="$slots.title"
        #title
      >
        <slot name="title" />
      </template>
      <template
        v-if="$slots.actions"
        #actions
      >
        <slot name="actions" />
      </template>
    </EntityConfigCardView>
  </div>
</template>

<script setup lang="ts">
import { createConfigCardSchema } from './config-card-schema'
import type { EntityConfigCardViewConfig } from '@kong-ui-public/entities-shared'
import type { PropType } from 'vue'
import { EntityConfigCardView, SupportedEntityType, useHelpers } from '@kong-ui-public/entities-shared'
import composables from '../composables'
import '@kong-ui-public/entities-shared/dist/style.css'

defineProps({
  record: { type: Object as PropType<Record<string, any>>, required: true },
  config: {
    type: Object as PropType<EntityConfigCardViewConfig>,
    default: () => ({}),
  },
  /**
   * Control visibility of card title content
   */
  hideTitle: {
    type: Boolean,
    default: false,
  },
})


const { i18n: { t }, i18nT } = composables.useI18n()
const { getPropValue } = useHelpers()

const configSchema = createConfigCardSchema(t)
</script>
