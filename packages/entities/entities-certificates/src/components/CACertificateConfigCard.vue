<template>
  <div class="kong-ui-ca-certificate-entity-config-card">
    <EntityBaseConfigCard
      :config="config"
      :config-card-doc="configCardDoc"
      :config-schema="configSchema"
      :entity-type="SupportedEntityType.CaCertificate"
      :fetch-url="fetchUrl"
      :hide-title="hideTitle"
      @fetch:error="(err: any) => $emit('fetch:error', err)"
      @fetch:success="handleFetch"
      @loading="(val: boolean) => $emit('loading', val)"
    >
      <template #cert="slotProps">
        <KCodeBlock
          v-if="getPropValue('rowValue', slotProps)"
          :id="`ca-cert-${config.entityId}-cert-codeblock`"
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
    </EntityBaseConfigCard>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import { computed, ref } from 'vue'
import type { AxiosError } from 'axios'
import type { KongManagerCertificateEntityConfig, KonnectCertificateEntityConfig, CACertificateConfigurationSchema, EntityRow } from '../types'
import {
  EntityBaseConfigCard,
  ConfigurationSchemaType,
  ConfigurationSchemaSection,
  useStringHelpers,
  useHelpers,
  ConfigCardItem,
  SupportedEntityType,
} from '@kong-ui-public/entities-shared'
import endpoints from '../ca-certificates-endpoints'
import composables from '../composables'
import '@kong-ui-public/entities-shared/dist/style.css'

const HIDDEN_METADATA = ['dns_names', 'san_names', 'subject']

const emit = defineEmits<{
  (e: 'loading', isLoading: boolean): void
  (e: 'fetch:error', error: AxiosError): void
  (e: 'fetch:success', data: Record<string, any>): void
}>()

// Component props - This structure must exist in ALL entity components, with the exclusion of unneeded action props (e.g. if you don't need `canDelete`, just exclude it)
const props = defineProps({
  /** The base konnect or kongManger config. Pass additional config props in the shared entity component as needed. */
  config: {
    type: Object as PropType<KonnectCertificateEntityConfig | KongManagerCertificateEntityConfig>,
    required: true,
    validator: (config: KonnectCertificateEntityConfig | KongManagerCertificateEntityConfig): boolean => {
      if (!config || !['konnect', 'kongManager'].includes(config?.app)) return false
      if (config.app === 'konnect' && !config.controlPlaneId) return false
      if (config.app === 'kongManager' && typeof config.workspace !== 'string') return false
      if (!config.entityId) return false
      return true
    },
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

const fetchUrl = computed((): string => endpoints.form[props.config.app].edit)
const record = ref<EntityRow>()
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

const handleFetch = (entity: Record<string, any>) => {
  record.value = entity as EntityRow
  emit('fetch:success', entity)
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
