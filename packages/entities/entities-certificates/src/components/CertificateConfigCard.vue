<template>
  <div class="kong-ui-certificate-entity-config-card">
    <EntityBaseConfigCard
      :config="config"
      :config-card-doc="configCardDoc"
      :config-schema="(configSchema as any)"
      :entity-type="SupportedEntityType.Certificate"
      :fetch-url="fetchUrl"
      :hide-title="hideTitle"
      @fetch:error="(err: any) => $emit('fetch:error', err)"
      @fetch:success="handleFetch"
      @loading="(val: boolean) => $emit('loading', val)"
    >
      <template #cert-label-tooltip>
        <i18nT
          keypath="certificates.form.fields.cert.tooltip"
          scope="global"
        >
          <template #emphasis>
            <i>{{ t('certificates.form.fields.cert.emphasis') }}</i>
          </template>
        </i18nT>
      </template>
      <template #cert="slotProps">
        <KCodeBlock
          v-if="getPropValue('rowValue', slotProps)"
          :id="`certificate-${config.entityId}-cert-codeblock`"
          :code="getPropValue('rowValue', slotProps)"
          language="plaintext"
          single-line
        />
      </template>
      <template #key-label-tooltip>
        <i18nT
          keypath="certificates.form.fields.key.tooltip"
          scope="global"
        >
          <template #emphasis>
            <i>{{ t('certificates.form.fields.key.emphasis') }}</i>
          </template>
        </i18nT>
      </template>

      <template #metadata-label>
        <KLabel class="metadata-label">
          Metadata
        </KLabel>
      </template>

      <!-- Certificate metadata -->
      <template #metadata="slotProps">
        <ConfigCardItem
          v-for="propKey in Object.keys(getPropValue('rowValue', slotProps))"
          :key="propKey"
          :item="{
            key: propKey,
            value: getPropItemValue(propKey, slotProps),
            label: getMetadataLabel(propKey),
            type: (propKey === 'key_usages' || propKey === 'snis' || propKey === 'dns_names') ? ConfigurationSchemaType.BadgeTag : ConfigurationSchemaType.Text,
          }"
        />
      </template>
      <template
        v-if="!hasSnis"
        #snis
      >
        &ndash;
      </template>
      <template #expiry>
        {{ expiry || '&ndash;' }}
      </template>
      <template #issuer>
        {{ issuer || '&ndash;' }}
      </template>
      <template #san_names>
        {{ sanNames || '&ndash;' }}
      </template>
      <template #subject>
        {{ subject || '&ndash;' }}
      </template>

      <!-- Advanced Fields -->
      <template #cert_alt-label-tooltip>
        <i18nT
          keypath="certificates.form.fields.cert_alt.tooltip"
          scope="global"
        >
          <template #emphasis>
            <i>{{ t('certificates.form.fields.cert_alt.emphasis') }}</i>
          </template>
        </i18nT>
      </template>
      <template
        v-if="hasCertAlt"
        #cert_alt="slotProps"
      >
        >
        <KCodeBlock
          v-if="getPropValue('rowValue', slotProps)"
          :id="`certificate-${config.entityId}-cert-alt-codeblock`"
          :code="getPropValue('rowValue', slotProps)"
          language="plaintext"
          single-line
        />
      </template>

      <template #key_alt-label-tooltip>
        <i18nT
          keypath="certificates.form.fields.key_alt.tooltip"
          scope="global"
        >
          <template #emphasis>
            <i>{{ t('certificates.form.fields.key_alt.emphasis') }}</i>
          </template>
        </i18nT>
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
import type { KongManagerCertificateEntityConfig, KonnectCertificateEntityConfig, CertificateConfigurationSchema, EntityRow } from '../types'
import {
  EntityBaseConfigCard,
  ConfigurationSchemaSection,
  ConfigurationSchemaType,
  ConfigCardItem,
  SupportedEntityType,
  useStringHelpers,
  useHelpers,
} from '@kong-ui-public/entities-shared'
import endpoints from '../certificates-endpoints'
import composables from '../composables'
import '@kong-ui-public/entities-shared/dist/style.css'

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

const { i18n: { t, formatUnixTimeStamp }, i18nT } = composables.useI18n()
const { convertKeyToTitle } = useStringHelpers()
const { getPropValue } = useHelpers()
const { getCertificateData } = composables.useCertificate()

const fetchUrl = computed((): string => endpoints.form[props.config.app].edit)
const record = ref<EntityRow>()

const configSchema = ref<CertificateConfigurationSchema>({
  // basic fields
  id: {},
  cert: {
    section: ConfigurationSchemaSection.Basic,
  },
  key: {
    section: ConfigurationSchemaSection.Basic,
    type: ConfigurationSchemaType.Redacted,
  },
  metadata: {
    section: ConfigurationSchemaSection.Basic,
    type: ConfigurationSchemaType.Json,
  },
  snis: {
    section: ConfigurationSchemaSection.Basic,
    type: ConfigurationSchemaType.BadgeTag,
    label: t('certificates.list.table_headers.snis'),
  },
  updated_at: {},
  created_at: {},
  tags: {
    tooltip: t('certificates.form.fields.tags.tooltip'),
  },
  ...(props.config.app === 'kongManager' && {
    expiry: {
      section: ConfigurationSchemaSection.Basic,
      label: t('certificates.list.table_headers.expiry'),
      // @ts-ignore TODO: Confirm if this is correct
      forceShow: true,
    },
    issuer: {
      section: ConfigurationSchemaSection.Basic,
      label: t('certificates.list.table_headers.issuer'),
      forceShow: true,
    },
    san_names: {
      section: ConfigurationSchemaSection.Basic,
      label: t('certificates.list.table_headers.san'),
      forceShow: true,
    },
    subject: {
      section: ConfigurationSchemaSection.Basic,
      label: t('certificates.list.table_headers.subject'),
      forceShow: true,
    },
    key_usages: {
      forceShow: true,
    },
  }),
  // advanced fields
  cert_alt: {
    section: ConfigurationSchemaSection.Advanced,
  },
  key_alt: {
    section: ConfigurationSchemaSection.Advanced,
    type: ConfigurationSchemaType.Redacted,
  },
})

// because we need record data to parse cert data, assign it to local ref
const handleFetch = (entity: Record<string, any>) => {
  record.value = entity as EntityRow
  emit('fetch:success', entity)
}

const getPropItemValue = (propKey: string, slotProps?: Record<string, any>) => {
  const propValue = getPropValue('rowValue', slotProps)

  if (propKey === 'expiry') {
    return expiry.value
  } else if (propKey === 'key_usages') {
    return keyUsages.value
  } else if (propKey === 'san_names') {
    return sanNames.value
  }

  if (propValue) {
    return propValue[propKey]
  }

  return undefined
}

/**
 * Parsing Certificate Logic
 */

const parsedCertData = computed(() => {
  if (!record.value) {
    return undefined
  }

  return getCertificateData(record.value)
})

const expiry = computed((): string => parsedCertData.value?.schemaExpiry ? formatUnixTimeStamp(parsedCertData.value?.schemaExpiry) : '')
const issuer = computed((): string => parsedCertData.value?.schemaIssuer || '')
const sanNames = computed((): string => parsedCertData.value?.schemaSanNames || '')
const subject = computed((): string => parsedCertData.value?.schemaSubject || '')
const keyUsages = computed((): string[] => parsedCertData.value?.schemaKeyUsages || [])

const hasSnis = computed((): boolean => {
  return record?.value?.snis?.length > 0
})

const hasCertAlt = computed((): boolean => {
  return !!record?.value?.cert_alt
})

const getMetadataLabel = (propKey: string) => {
  if (propKey === 'san_names') {
    return t('certificates.list.table_headers.san')
  }

  // @ts-ignore - TODO: Fix type interface
  return configSchema.value?.[propKey as keyof typeof configSchema.value]?.label || convertKeyToTitle(propKey)
}

</script>

<style lang="scss" scoped>
.kong-ui-certificate-entity-config-card {
  :deep(.config-badge) {
    margin-right: var(--kui-space-20, $kui-space-20);
  }

  .metadata-label {
    font-size: var(--kui-font-size-40, $kui-font-size-40);
  }
}
</style>
