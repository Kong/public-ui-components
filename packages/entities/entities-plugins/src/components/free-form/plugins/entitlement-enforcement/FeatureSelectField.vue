<template>
  <!-- When the user can't list features (Metering & Billing not enabled / no access),
       the select is disabled and this alert points them to enable it in Konnect. -->
  <KAlert
    v-if="!canListFeatures"
    appearance="warning"
    class="ff-feature-unavailable"
    data-testid="ff-feature-unavailable"
    :message="t('plugins.free-form.governance.fields.feature_key.unavailable')"
    show-icon
  />

  <EnumField
    :disabled="!canListFeatures"
    enable-filtering
    :help="t('plugins.free-form.governance.fields.feature_key.help')"
    :items="allItems"
    :label="t('plugins.free-form.governance.fields.feature_key.label')"
    :loading="loading"
    name="config.feature.key"
  >
    <!-- Rich option: feature key as the title, human name as the description -->
    <template #item-label="item">
      <div class="ff-feature-option">
        <span class="ff-feature-option-key">{{ item.value }}</span>
        <span
          v-if="item.name"
          class="ff-feature-option-name"
        >
          {{ item.name }}
        </span>
      </div>
    </template>

    <!-- New-feature action, pinned to the dropdown footer. Shown only when the host
         says the user can create features. Emits up to the host app (FeatureSelectField
         → EntitlementEnforcementForm → host `click:create-entity`), which owns the creation flow. -->
    <template
      v-if="canCreateFeature"
      #dropdown-footer-text
    >
      <div
        class="ff-feature-create"
        data-testid="ff-feature-create-action"
        @click="emit('click:create-entity', { type: 'feature' })"
      >
        <span>{{ t('plugins.free-form.governance.fields.feature_key.create_feature') }}</span>
      </div>
    </template>
  </EnumField>
</template>

<script setup lang="ts">
import { computed, inject, onMounted, ref } from 'vue'
import { get } from 'lodash-es'
import type { SelectItem } from '@kong/kongponents'
import { FORMS_CONFIG } from '@kong-ui-public/forms'
import { useAxios, type KonnectBaseFormConfig, type KongManagerBaseFormConfig } from '@kong-ui-public/entities-shared'
import EnumField from '../../shared/EnumField.vue'
import { useFormShared } from '../../shared/composables'
import useI18n from '../../../../composables/useI18n'
import type { EntityCreateEvent } from '../../../../types'

// The new-feature action emits this; EntitlementEnforcementForm forwards it to the host app.
const emit = defineEmits<{
  'click:create-entity': [payload: EntityCreateEvent]
}>()

const { i18n: { t } } = useI18n()

const appConfig = inject<KonnectBaseFormConfig | KongManagerBaseFormConfig | undefined>(FORMS_CONFIG)
const { axiosInstance } = useAxios(appConfig?.axiosRequestConfig)
const { formData } = useFormShared()

// Host precomputes whether the user can list features (Metering & Billing enabled +
// permission). Only an explicit `false` disables the field — omitted/true = allowed.
// Guards the feature-list query only.
const canListFeatures = computed(() => appConfig?.metering?.canListFeatures !== false)

// Host precomputes whether the user can create features. Only an explicit `false`
// hides the "New feature" action — omitted/true = shown.
const canCreateFeature = computed(() => appConfig?.metering?.canCreateFeature !== false)

// Each item carries the feature `name` alongside label/value for the option template.
const items = ref<Array<SelectItem<string>>>([])
const loading = ref(false)

/**
 * OpenMeter features list. The response shape is `{ data: Feature[], meta }`
 * where each Feature has `key` and `name`. The endpoint is supplied by the host
 * app via `config.metering.featuresEndpoint` rather than hardcoded here.
 */
const featuresUrl = computed(() => appConfig?.metering?.featuresEndpoint ?? '')

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

async function loadFeatures() {
  // Nothing to fetch when the user can't list features or the host hasn't configured
  // a features endpoint — keep the current value selectable via `allItems`.
  if (!canListFeatures.value || !featuresUrl.value) return

  loading.value = true
  try {
    const res = await axiosInstance.get(featuresUrl.value)
    const features = res.data?.data ?? []
    items.value = features.map((feature: any): SelectItem<string> => ({
      label: feature.key,
      value: feature.key,
      name: feature.name,
    }))
  } catch (error) {
    // The endpoint may be unavailable (e.g. local playground without a backend).
    // Degrade gracefully: keep the current value selectable and log for debugging.
    console.warn('[governance]', t('plugins.free-form.governance.fields.feature_key.load_error'), error)
  } finally {
    loading.value = false
  }
}

onMounted(loadFeatures)
</script>

<style lang="scss" scoped>
.ff-feature-option {
  display: flex;
  flex-direction: column;
  gap: var(--kui-space-10, $kui-space-10);

  &-key {
    color: var(--kui-color-text, $kui-color-text);
    font-weight: var(--kui-font-weight-medium, $kui-font-weight-medium);
  }

  &-name {
    color: var(--kui-color-text-neutral, $kui-color-text-neutral);
    font-size: var(--kui-font-size-20, $kui-font-size-20);
  }
}

.ff-feature-create {
  align-items: center;
  color: var(--kui-color-text-primary, $kui-color-text-primary);
  cursor: pointer;
  display: flex;
  gap: var(--kui-space-10, $kui-space-10);
  pointer-events: auto;
}
</style>
