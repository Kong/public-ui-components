<template>
  <EnumField
    enable-filtering
    :help="t('plugins.free-form.governance.fields.feature_key.help')"
    :items="allItems"
    :label="t('plugins.free-form.governance.fields.feature_key.label')"
    :loading="loading"
    name="config.feature.key"
  >
    <!-- Rich option: feature key + metered badge, with the human name beneath -->
    <template #item-label="item">
      <div class="ff-feature-option">
        <div class="ff-feature-option-title">
          <span class="ff-feature-option-key">{{ item.value }}</span>
          <KBadge
            v-if="metaFor(item.value)?.metered"
            appearance="info"
          >
            {{ t('plugins.free-form.governance.fields.feature_key.metered_badge') }}
          </KBadge>
        </div>
        <span
          v-if="metaFor(item.value)?.name && metaFor(item.value)?.name !== item.value"
          class="ff-feature-option-name"
        >
          {{ metaFor(item.value)?.name }}
        </span>
      </div>
    </template>
  </EnumField>
</template>

<script setup lang="ts">
import { computed, inject, onMounted, ref } from 'vue'
import { get } from 'lodash-es'
import { KBadge, type SelectItem } from '@kong/kongponents'
import { FORMS_CONFIG } from '@kong-ui-public/forms'
import { useAxios, type KonnectBaseFormConfig, type KongManagerBaseFormConfig } from '@kong-ui-public/entities-shared'
import EnumField from '../../shared/EnumField.vue'
import { useFormShared } from '../../shared/composables'
import useI18n from '../../../../composables/useI18n'

const { i18n: { t } } = useI18n()

const appConfig = inject<KonnectBaseFormConfig | KongManagerBaseFormConfig | undefined>(FORMS_CONFIG)
const { axiosInstance } = useAxios(appConfig?.axiosRequestConfig)
const { formData } = useFormShared()

interface FeatureMeta {
  name?: string
  metered?: boolean
}

const items = ref<Array<SelectItem<string>>>([])
// Per-key display metadata (name + metered flag) for the option template.
const meta = ref<Record<string, FeatureMeta>>({})
const loading = ref(false)

function metaFor(value: unknown): FeatureMeta | undefined {
  return typeof value === 'string' ? meta.value[value] : undefined
}

/**
 * OpenMeter features list. The response shape is `{ data: Feature[], meta }`
 * where each Feature has `key`, `name`, and an optional `meter` (metered feature).
 *
 * NOTE: the base URL and path are pending backend finalization — the governance
 * service proxies OpenMeter, so this is expected to resolve through the same
 * Konnect API base used elsewhere in the form.
 */
const featuresUrl = computed(() => `${appConfig?.apiBaseUrl ?? ''}/api/v3/openmeter/features`)

// Ensure the currently-selected key is always selectable even before/without a
// successful fetch (e.g. editing an existing plugin, or local dev with no backend).
const currentKey = computed<string | undefined>(() => get(formData, ['config', 'feature', 'key']))

const allItems = computed<Array<SelectItem<string>>>(() => {
  const list = [...items.value]
  if (currentKey.value && !list.some(item => item.value === currentKey.value)) {
    list.unshift({ label: currentKey.value, value: currentKey.value })
  }
  return list
})

onMounted(async () => {
  loading.value = true
  try {
    const res = await axiosInstance.get(featuresUrl.value)
    const features = res.data?.data ?? []
    items.value = features.map((feature: any): SelectItem<string> => ({ label: feature.key, value: feature.key }))
    meta.value = features.reduce((acc: Record<string, FeatureMeta>, feature: any) => {
      acc[feature.key] = { name: feature.name, metered: !!feature.meter }
      return acc
    }, {})
  } catch (error) {
    // The endpoint may be unavailable (e.g. local playground without a backend).
    // Degrade gracefully: keep the current value selectable and log for debugging.
    console.warn('[governance]', t('plugins.free-form.governance.fields.feature_key.load_error'), error)
  } finally {
    loading.value = false
  }
})
</script>

<style lang="scss" scoped>
.ff-feature-option {
  display: flex;
  flex-direction: column;
  gap: var(--kui-space-10, $kui-space-10);

  &-title {
    display: flex;
    align-items: center;
    gap: var(--kui-space-40, $kui-space-40);
  }

  &-key {
    font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
  }

  &-name {
    color: var(--kui-color-text-neutral, $kui-color-text-neutral);
    font-size: var(--kui-font-size-20, $kui-font-size-20);
  }
}
</style>
