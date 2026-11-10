<template>
  <div>
    <EntityConfigCardView
      :config="config"
      :config-schema="configSchema"
      :entity-type="SupportedEntityType.GatewayService"
      :hide-title="hideTitle"
      :record="record"
    >
      <template #enabled-label-tooltip>
        <i18nT
          keypath="gateway_services.form.fields.enabled.tooltip"
          scope="global"
        >
          <template #false>
            <code>{{ t('gateway_services.form.fields.enabled.false') }}</code>
          </template>
          <template #true>
            <code>{{ t('gateway_services.form.fields.enabled.true') }}</code>
          </template>
        </i18nT>
      </template>

      <template #ca_certificates-label-tooltip>
        <i18nT
          keypath="gateway_services.form.fields.ca_certificates.tooltip"
          scope="global"
        >
          <template #code1>
            <code>{{ t('gateway_services.form.fields.ca_certificates.code1') }}</code>
          </template>
          <template #code2>
            <code>{{ t('gateway_services.form.fields.ca_certificates.code2') }}</code>
          </template>
        </i18nT>
      </template>

      <template #tls_verify-label-tooltip>
        <i18nT
          keypath="gateway_services.form.fields.tls_verify_enabled.tooltip"
          scope="global"
        >
          <template #code1>
            <code>{{ t('gateway_services.form.fields.tls_verify_enabled.code1') }}</code>
          </template>
        </i18nT>
      </template>

      <template #tls_verify="slotProps">
        {{
          typeof getPropValue('rowValue', slotProps) === 'boolean'
            ? getTlsVerifyOption('rowValue', slotProps)
            : t('gateway_services.form.fields.tls_verify_option.unset.display')
        }}
      </template>

      <template #client_certificate="slotProps">
        {{ getPropValue('rowValue', slotProps) ? getPropValue('rowValue', slotProps).id : '–' }}
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

const getTlsVerifyOption = (propName: string, slotProps?: Record<string, any>) => {
  if (getPropValue(propName, slotProps) === true) {
    return t('gateway_services.form.fields.tls_verify_option.true.display')
  }

  return t('gateway_services.form.fields.tls_verify_option.false.display')
}

const configSchema = createConfigCardSchema(t)
</script>
