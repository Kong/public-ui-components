<template>
  <div>
    <EntityConfigCardView
      :code-block-record-formatter="codeBlockRecordFormatter"
      :config="config"
      :config-schema="configSchema"
      :entity-type="SupportedEntityType.Certificate"
      :hide-title="hideTitle"
      :record="record"
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
          :id="`certificate-${record.id}-cert-codeblock`"
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
        <KCodeBlock
          v-if="getPropValue('rowValue', slotProps)"
          :id="`certificate-${record.id}-cert-alt-codeblock`"
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
import { createCertificateConfigCardSchema } from './certificate-config-card-schema'
import type { EntityConfigCardViewConfig } from '@kong-ui-public/entities-shared'
import type { PropType } from 'vue'
import { computed } from 'vue'
import type { EntityRow } from '../types'
import { EntityConfigCardView, ConfigurationSchemaType, ConfigCardItem, SupportedEntityType, useStringHelpers, useHelpers } from '@kong-ui-public/entities-shared'
import composables from '../composables'
import { codeBlockRecordFormatter } from '../utils/code-block'
import '@kong-ui-public/entities-shared/dist/style.css'


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

const { i18n: { t, formatUnixTimeStamp }, i18nT } = composables.useI18n()
const { convertKeyToTitle } = useStringHelpers()
const { getPropValue } = useHelpers()
const record = computed(() => props.record as EntityRow)

const configSchema = createCertificateConfigCardSchema(t, props.config.app === 'kongManager')

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

const parsedCertData = composables.useCertificateViewData(() => record.value.cert)
const expiry = computed(() => parsedCertData.value.schemaExpiry ? formatUnixTimeStamp(parsedCertData.value.schemaExpiry) : '')
const issuer = computed(() => parsedCertData.value.schemaIssuer)
const sanNames = computed(() => parsedCertData.value.schemaSanNames)
const subject = computed(() => parsedCertData.value.schemaSubject)
const keyUsages = computed(() => parsedCertData.value.schemaKeyUsages)

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

  return configSchema[propKey]?.label || convertKeyToTitle(propKey)
}

</script>

<style lang="scss" scoped>
:deep(.config-badge) {
  margin-right: var(--kui-space-20, $kui-space-20);
}

.metadata-label {
  font-size: var(--kui-font-size-40, $kui-font-size-40);
}
</style>
