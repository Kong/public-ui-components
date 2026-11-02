<template>
  <div class="kong-ui-ca-certificate-entity-config-card">
    <EntityConfigCardView
      :code-block-record-formatter="codeBlockRecordFormatter"
      :config="config"
      :config-card-doc="configCardDoc"
      :config-schema="configSchema"
      :entity-type="SupportedEntityType.CaCertificate"
      :hide-title="hideTitle"
      :record="displayRecord"
      :request-url="requestUrl"
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
        v-for="slotKey in Object.keys($slots)"
        :key="slotKey"
        #[slotKey]="slotProps"
      >
        <slot
          :name="slotKey"
          v-bind="slotProps"
        />
      </template>
    </EntityConfigCardView>
  </div>
</template>

<script setup lang="ts">
import type { EntityConfigCardViewConfig } from '@kong-ui-public/entities-shared'
import type { PropType } from 'vue'
import { computed, ref } from 'vue'
import type { CACertificateConfigurationSchema, EntityRow } from '../types'
import { EntityConfigCardView, ConfigurationSchemaType, ConfigurationSchemaSection, useStringHelpers, useHelpers, ConfigCardItem, SupportedEntityType } from '@kong-ui-public/entities-shared'
import composables from '../composables'
import { codeBlockRecordFormatter } from '../utils/code-block'
import '@kong-ui-public/entities-shared/dist/style.css'

const HIDDEN_METADATA = ['dns_names', 'san_names', 'subject']


const props = defineProps({
  /** The base konnect or kongManger config. Pass additional config props in the shared entity component as needed. */
  record: { type: Object as PropType<Record<string, any>>, required: true },
  requestUrl: { type: String, default: '' },
  config: {
    type: Object as PropType<EntityConfigCardViewConfig>,
    default: () => ({}),
  },
  /**
   * External link for documentation that determines visibility of Documentation button
   */
  configCardDoc: {
    type: String,
    default: '',
    required: false,
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
const { getCertificateData } = composables.useCertificate()

const record = computed(() => props.record as EntityRow)
const parsedCertData = computed(() => {
  if (!record.value) {
    return undefined
  }

  return getCertificateData(record.value)
})
const issuer = computed((): string => parsedCertData.value?.schemaIssuer || '')
const expiry = computed((): string => parsedCertData.value?.schemaExpiry ? formatUnixTimeStamp(parsedCertData.value?.schemaExpiry) : '')
const keyUsages = computed((): string[] => parsedCertData.value?.schemaKeyUsages || [])

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


const configSchema = ref<CACertificateConfigurationSchema>({
  id: {},
  updated_at: {},
  created_at: {},
  cert: {
    section: ConfigurationSchemaSection.Basic,
    label: t('ca-certificates.form.fields.cert.label'),
    tooltip: t('ca-certificates.form.fields.cert.tooltip'),
    order: 5,
  },
  cert_digest: {
    section: ConfigurationSchemaSection.Basic,
    label: t('ca-certificates.form.fields.cert_digest.label'),
    tooltip: t('ca-certificates.form.fields.cert_digest.tooltip'),
    order: 6,
  },
  metadata: {
    section: ConfigurationSchemaSection.Basic,
    type: ConfigurationSchemaType.Json,
    order: 7,
  },
  ...(props.config.app === 'kongManager' && {
    expiry: {
      label: t('certificates.list.table_headers.expiry'),
      section: ConfigurationSchemaSection.Basic,
      order: 1.7,
      forceShow: true,
    },
    issuer: {
      section: ConfigurationSchemaSection.Basic,
      order: 1.5,
      forceShow: true,
    },
    key_usages: {
      section: ConfigurationSchemaSection.Basic,
      forceShow: true,
    },
  }),
  tags: {
    tooltip: t('ca-certificates.form.fields.tags.tooltip'),
  },
})
const displayRecord = computed(() => props.record)
</script>

<style lang="scss" scoped>
.kong-ui-ca-certificate-entity-config-card {
  :deep(.config-badge) {
    margin-right: var(--kui-space-20, $kui-space-20);
  }

  .metadata-label {
    font-size: var(--kui-font-size-40, $kui-font-size-40);
  }
}
</style>
