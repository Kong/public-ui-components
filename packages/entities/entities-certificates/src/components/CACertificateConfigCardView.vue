<template>
  <div>
    <EntityConfigCardView
      :code-block-record-formatter="codeBlockRecordFormatter"
      :config="config"
      :config-schema="configSchema"
      :entity-type="SupportedEntityType.CaCertificate"
      :hide-title="hideTitle"
      :record="record"
    >
      <template #cert="slotProps">
        <KCodeBlock
          v-if="getPropValue('rowValue', slotProps)"
          :id="`ca-cert-${record.id}-cert-codeblock`"
          :code="getPropValue('rowValue', slotProps)"
          language="plaintext"
          single-line
        />
      </template>
      <template #metadata-label>
        <KLabel class="metadata-label">
          Metadata
        </KLabel>
      </template>

      <template #metadata="slotProps">
        <ConfigCardItem
          v-for="propKey in Object.keys(getPropValue('rowValue', slotProps)).filter((prop: string) => !HIDDEN_METADATA.includes(prop))"
          :key="propKey"
          :data-testid="`ca-cert-metadata-${propKey}`"
          :item="{
            key: propKey,
            label: convertKeyToTitle(propKey),
            value: getPropItemValue(propKey, slotProps),
            type: propKey === 'key_usages' ? ConfigurationSchemaType.BadgeTag : ConfigurationSchemaType.Text,
          }"
        />
      </template>
      <template #expiry>
        {{ expiry || '&ndash;' }}
      </template>
      <template #issuer>
        {{ issuer || '&ndash;' }}
      </template>
      <template #key_usages>
        <div v-if="!keyUsages.length">
          {{ '&ndash;' }}
        </div>
        <KBadge
          v-for="(tag, idx) in keyUsages"
          :key="`key_usages-badge-tag-${idx}`"
          class="config-badge"
          :data-testid="`key_usages-badge-tag-${idx}`"
          :tooltip="tag"
          truncation-tooltip
        >
          {{ tag }}
        </KBadge>
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
import { createCACertificateConfigCardSchema } from './certificate-config-card-schema'
import type { EntityConfigCardViewConfig } from '@kong-ui-public/entities-shared'
import type { PropType } from 'vue'
import { computed } from 'vue'
import type { EntityRow } from '../types'
import { EntityConfigCardView, ConfigurationSchemaType, useStringHelpers, useHelpers, ConfigCardItem, SupportedEntityType } from '@kong-ui-public/entities-shared'
import composables from '../composables'
import { codeBlockRecordFormatter } from '../utils/code-block'
import '@kong-ui-public/entities-shared/dist/style.css'

const HIDDEN_METADATA = ['dns_names', 'san_names', 'subject']


const props = defineProps({
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

const { i18n: { t, formatUnixTimeStamp } } = composables.useI18n()
const { convertKeyToTitle } = useStringHelpers()
const { getPropValue } = useHelpers()
const record = computed(() => props.record as EntityRow)
const parsedCertData = composables.useCertificateViewData(() => record.value.cert)
const issuer = computed(() => parsedCertData.value.schemaIssuer)
const expiry = computed(() => parsedCertData.value.schemaExpiry ? formatUnixTimeStamp(parsedCertData.value.schemaExpiry) : '')
const keyUsages = computed(() => parsedCertData.value.schemaKeyUsages)

const getPropItemValue = (propKey: string, slotProps?: Record<string, any>) => {
  const propValue = getPropValue('rowValue', slotProps)

  if (propKey === 'expiry') {
    return expiry.value
  } else if (propKey === 'key_usages') {
    return keyUsages.value
  }

  if (propValue) {
    return propValue[propKey]
  }

  return undefined
}


const configSchema = createCACertificateConfigCardSchema(t, props.config.app === 'kongManager')
</script>

<style lang="scss" scoped>
:deep(.config-badge) {
  margin-right: var(--kui-space-20, $kui-space-20);
}

.metadata-label {
  font-size: var(--kui-font-size-40, $kui-font-size-40);
}
</style>
