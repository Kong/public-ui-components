<template>
  <KAlert
    v-if="field.error"
    appearance="danger"
    :message="field.error.message"
  />
  <KMultiselect
    v-else
    v-show="!hide"
    v-model="selectedIds"
    v-bind="fieldAttrs"
    autosuggest
    clearable
    :data-testid="`ff-${field.path!.value}`"
    :items="certItems"
    :loading="loadingCertificates"
    @query-change="debouncedQueryChange"
  >
    <template
      v-if="fieldAttrs.labelAttributes?.info"
      #label-tooltip
    >
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div v-html="fieldAttrs.labelAttributes.info" />
    </template>
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
  </KMultiselect>
</template>

<script setup lang="ts">
import { computed, inject, onBeforeMount, toRef } from 'vue'
import { KBadge, KMultiselect } from '@kong/kongponents'
import type { LabelAttributes, MultiselectItem } from '@kong/kongponents'
import { FORMS_CONFIG } from '@kong-ui-public/forms'
import { useDebouncedFilter } from '@kong-ui-public/entities-shared'

import endpoints from '../../../../plugins-endpoints'
import { useField, useFieldAttrs } from '../../shared/composables'
import type { BaseFieldProps, EmptyValue } from '../../shared/types'
import type { KonnectPluginFormConfig, KongManagerPluginFormConfig } from '../../../../types'

interface CertificateItem extends MultiselectItem {
  subject?: string
  tags?: string[]
}

interface CaCertificatesFieldProps extends BaseFieldProps {
  labelAttributes?: LabelAttributes
  required?: boolean
  placeholder?: string
}

const props = defineProps<CaCertificatesFieldProps>()

const { value: fieldValue, hide, ...field } = useField<string[] | EmptyValue>(toRef(() => props.name))

const fieldAttrs = useFieldAttrs(field.path!, toRef(() => props))

const formConfig = inject<KonnectPluginFormConfig | KongManagerPluginFormConfig>(FORMS_CONFIG)!

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
  get: () => fieldValue!.value ?? [],
  set: (value) => {
    fieldValue!.value = value.length ? value : field.emptyValue!.value
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
