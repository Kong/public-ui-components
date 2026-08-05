<template>
  <KMultiselect
    v-model="selectedIds"
    autosuggest
    clearable
    data-testid="dk-ca-certificates-field"
    :items="certItems"
    :label="t('plugins.free-form.datakit.ca_certificates.label')"
    :label-attributes="({
      info: t('plugins.free-form.datakit.ca_certificates.tooltip'),
      tooltipAttributes: { maxWidth: '400' },
    } as any)"
    :loading="loadingCertificates"
    :placeholder="t('plugins.free-form.datakit.ca_certificates.placeholder')"
    @query-change="debouncedQueryChange"
  >
    <template #item-template="{ item }">
      <div class="dk-ca-cert-item">
        <div class="dk-ca-cert-item-header">
          <div class="dk-ca-cert-item-id">
            {{ item.label }}
          </div>
          <div
            v-if="(item as CertificateItem).tags?.length"
            class="dk-ca-cert-item-tags"
          >
            <KBadge
              v-for="tag in (item as CertificateItem).tags"
              :key="tag"
              appearance="neutral"
              size="small"
            >
              {{ tag }}
            </KBadge>
          </div>
        </div>
        <div
          v-if="(item as CertificateItem).subject"
          class="dk-ca-cert-item-subject"
        >
          {{ (item as CertificateItem).subject }}
        </div>
      </div>
    </template>
    <template #empty>
      <div>{{ t('plugins.free-form.datakit.ca_certificates.empty') }}</div>
    </template>
  </KMultiselect>
</template>

<script setup lang="ts">
import { computed, inject, onBeforeMount } from 'vue'
import { createI18n } from '@kong-ui-public/i18n'
import { KBadge, KMultiselect } from '@kong/kongponents'
import type { MultiselectItem } from '@kong/kongponents'
import { FORMS_CONFIG } from '@kong-ui-public/forms'
import { useDebouncedFilter } from '@kong-ui-public/entities-shared'

import english from '../../../../locales/en.json'
import endpoints from '../../../../plugins-endpoints'
import { useFormShared } from '../../shared/composables'
import type { KonnectPluginFormConfig, KongManagerPluginFormConfig } from '../../../../types'
import type { DatakitPluginData } from './types'

interface CertificateItem extends MultiselectItem {
  subject?: string
  tags?: string[]
}

const { t } = createI18n<typeof english>('en-us', english)

const formConfig = inject<KonnectPluginFormConfig | KongManagerPluginFormConfig>(FORMS_CONFIG)!

const { formData, setValue } = useFormShared<DatakitPluginData>()

const {
  debouncedQueryChange: debouncedFilterQueryChange,
  loading: loadingCertificates,
  results,
  loadItems,
} = useDebouncedFilter(formConfig, endpoints.caCertificates[formConfig.app])

function debouncedQueryChange(query: string) {
  debouncedFilterQueryChange(query)
}

const selectedIds = computed<string[]>({
  get: () => formData.config?.ca_certificates ?? [],
  set: (value) => {
    setValue({
      ...formData,
      config: {
        ...formData.config,
        ca_certificates: value.length ? value : null,
      },
    })
  },
})

const certItems = computed<CertificateItem[]>(() => {
  return results.value.map((cert): CertificateItem => ({
    label: cert.id,
    value: cert.id,
    subject: cert.metadata?.subject,
    tags: cert.tags,
    selected: selectedIds.value.includes(cert.id),
  }))
})

onBeforeMount(async () => {
  await loadItems()
})
</script>

<style lang="scss" scoped>
.dk-ca-cert-item {
  .dk-ca-cert-item-header {
    align-items: center;
    display: flex;
    gap: var(--kui-space-20, $kui-space-20);
    justify-content: space-between;
  }

  .dk-ca-cert-item-subject {
    color: var(--kui-color-text-neutral, $kui-color-text-neutral);
    font-size: var(--kui-font-size-20, $kui-font-size-20);
  }

  .dk-ca-cert-item-tags {
    display: flex;
    flex-shrink: 0;
    flex-wrap: wrap;
    gap: var(--kui-space-40, $kui-space-40);
  }
}
</style>
